import { readFile } from 'node:fs/promises';
import { homedir, networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';

if (typeof globalThis.WebSocket !== 'function') {
  console.error('Node 22+ required (global WebSocket).');
  process.exit(1);
}
if (typeof globalThis.fetch !== 'function') {
  console.error('Node 22+ required (global fetch).');
  process.exit(1);
}

const filename = 'material-purifier-card.js';
const resourcePath = `/local/material-purifier-card/${filename}`;
const sha256 = (body) => createHash('sha256').update(body).digest('hex');

async function loadSettings() {
  const fallback = {};
  if (!process.env.HA_URL || !process.env.HA_TOKEN) {
    try {
      const text = await readFile(join(homedir(), '.config/ha-material-purifier/env'), 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!match) continue;
        let value = match[2];
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        fallback[match[1]] = value;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw new Error('Unable to read HA configuration file.');
    }
  }
  const token = process.env.HA_TOKEN || fallback.HA_TOKEN;
  const rawUrl = process.env.HA_URL || fallback.HA_URL;
  if (!rawUrl || !token) throw new Error('Set HA_URL and HA_TOKEN or ~/.config/ha-material-purifier/env.');
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('HA_URL must be a valid HTTP(S) URL.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.search || url.hash || !['', '/'].includes(url.pathname)) {
    throw new Error('HA_URL must be an HTTP(S) origin without credentials, query or path.');
  }
  return { origin: url.origin, token };
}

function lanHost() {
  if (process.env.LAN_HOST) return process.env.LAN_HOST;
  for (const addresses of Object.values(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (!address.internal && address.family === 'IPv4' &&
          /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(address.address)) {
        return address.address;
      }
    }
  }
  throw new Error('No LAN IPv4 address found; set LAN_HOST.');
}

async function upload(origin, token, bundle, hash) {
  const host = lanHost();
  const port = Number(process.env.DEPLOY_PORT ?? 8799);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DEPLOY_PORT must be an integer between 1 and 65535.');
  }
  const server = createServer((request, response) => {
    if (request.url !== `/${filename}` || !['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'Content-Type': 'text/javascript',
      'Content-Length': bundle.length,
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : bundle);
  });
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '0.0.0.0', resolve);
    });
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    const response = await fetch(`${origin}/api/services/downloader/download_file`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: `http://${host}:${port}/${filename}`,
        subdir: 'material-purifier-card',
        filename,
        overwrite: true,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`Downloader request failed (HTTP ${response.status}).`);
    await response.arrayBuffer();
    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      try {
        const remote = await fetch(`${origin}${resourcePath}?t=${Date.now()}`, {
          headers,
          cache: 'no-store',
          signal: AbortSignal.timeout(Math.min(5000, deadline - Date.now())),
        });
        const body = Buffer.from(await remote.arrayBuffer());
        if (remote.ok && sha256(body) === hash) return;
      } catch {
        // Transient errors are retried until the bounded verification deadline.
      }
      await delay(Math.min(1000, Math.max(0, deadline - Date.now())));
    }
    throw new Error('Downloaded bundle did not match the local SHA-256 within 30 seconds.');
  } finally {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
  }
}

function registerResource(origin, token, url) {
  return new Promise((resolve, reject) => {
    const endpoint = new URL('/api/websocket', origin);
    endpoint.protocol = endpoint.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(endpoint);
    let phase = 'auth';
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.close();
      if (error) reject(error);
      else resolve();
    };
    const timer = setTimeout(() => finish(new Error('HA WebSocket request timed out.')), 30000);
    socket.addEventListener('error', () => finish(new Error('HA WebSocket connection failed.')));
    socket.addEventListener('close', () => {
      if (!settled) finish(new Error('HA WebSocket closed before resource registration.'));
    });
    socket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'auth_required' && phase === 'auth') {
          socket.send(JSON.stringify({ type: 'auth', access_token: token }));
        } else if (message.type === 'auth_invalid') {
          finish(new Error('HA WebSocket authentication failed.'));
        } else if (message.type === 'auth_ok' && phase === 'auth') {
          phase = 'list';
          socket.send(JSON.stringify({ id: 1, type: 'lovelace/resources' }));
        } else if (message.type === 'result' && message.id === 1 && phase === 'list') {
          if (!message.success || !Array.isArray(message.result)) {
            throw new Error('Unable to list Lovelace resources.');
          }
          const existing = message.result.find((resource) =>
            typeof resource.url === 'string' && resource.url.startsWith(resourcePath)
          );
          phase = 'save';
          socket.send(JSON.stringify(existing ? {
            id: 2,
            type: 'lovelace/resources/update',
            resource_id: existing.id,
            res_type: 'module',
            url,
          } : {
            id: 2,
            type: 'lovelace/resources/create',
            res_type: 'module',
            url,
          }));
        } else if (message.type === 'result' && message.id === 2 && phase === 'save') {
          finish(message.success ? undefined : new Error('Unable to save Lovelace resource.'));
        }
      } catch {
        finish(new Error('HA WebSocket resource registration failed.'));
      }
    });
  });
}

try {
  const { origin, token } = await loadSettings();
  const bundle = await readFile(new URL('../dist/material-purifier-card.js', import.meta.url));
  const hash = sha256(bundle);
  await upload(origin, token, bundle, hash);
  const url = `${resourcePath}?v=${hash.slice(0, 8)}`;
  await registerResource(origin, token, url);
  console.log(url);
} catch {
  // Never print remote response bodies, raw exceptions, configuration or credentials.
  console.error('HA deployment failed. Check configuration, connectivity, Downloader and Lovelace permissions.');
  process.exitCode = 1;
}
