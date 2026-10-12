export interface ParticleOptions {
  raf?: (cb: FrameRequestCallback) => number;
  caf?: (id: number) => void;
  now?: () => number;
  random?: () => number;
  reducedMotion?: () => boolean;
  maxParticles?: number;
}

export const FADE_START = 0.72;
export const ABSORB_R = 0.22;
/** Compatibility alias for the start of the inward fade, not an absorption edge. */
export const HALO_EDGE = FADE_START;
export const SPAWN_MIN = 0.8;
export const SPAWN_MAX = 1.0;
const SPEED_TAU = 0.6;
const STOP_SPEED = 0.01; // R/s: below perceptible motion, preserve the stopped position.

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Number.isNaN(value) ? min : value));

export function fadeFactor(rNorm: number): number {
  const t = clamp((rNorm - ABSORB_R) / (FADE_START - ABSORB_R), 0, 1);
  return t * t * (3 - 2 * t);
}

export function targetPopulation(pm25: number | null, maxParticles = 120): number {
  return pm25 === null || Number.isNaN(pm25) || pm25 <= 0
    ? 0
    : Math.min(maxParticles, Math.round(3 + 0.6 * pm25));
}

export function spawnRatePerSecond(pm25: number | null, fraction: number | null = null): number {
  return targetPopulation(pm25) / travelTime(fraction);
}

export function inwardSpeed(fraction: number | null, rNorm: number): number {
  return fraction === null
    ? 0
    : (0.05 + 0.95 * clamp(fraction, 0, 1) ** 1.7) * (1 + 1.5 * (1 - clamp(rNorm, 0, 1)));
}

const travelTimes = new Float64Array(101);
/** Mean annulus-to-absorption transit; quantized to keep integration out of frames. */
export function travelTime(fraction: number | null): number {
  if (fraction === null) return 5.5;
  const key = Math.round(clamp(fraction, 0, 1) * 100);
  if (travelTimes[key] !== 0) return travelTimes[key];
  const dt = 0.001;
  let radius = (SPAWN_MIN + SPAWN_MAX) / 2;
  let seconds = 0;
  while (radius > ABSORB_R) {
    const distance = inwardSpeed(key / 100, radius) * dt;
    seconds += Math.min(1, (radius - ABSORB_R) / distance) * dt;
    radius -= distance;
  }
  travelTimes[key] = seconds;
  return seconds;
}

interface Particle {
  radius: number;
  angle: number;
  size: number;
  age: number;
  lifetime: number;
  calmAge: number;
  phase: number;
}

// All geometry is in R-units; only drawing touches the DPR-scaled canvas.
export class ParticleField {
  private readonly context: CanvasRenderingContext2D | null;
  private readonly raf: (cb: FrameRequestCallback) => number;
  private readonly caf: (id: number) => void;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly reducedMotion: () => boolean;
  private motionQuery?: MediaQueryList;
  private removeMotionListener?: () => void;
  private readonly pool: Particle[];
  private live = 0;
  private population = 0;
  private carry = 0;
  private target: number | null = null;
  private effective = 0;
  private velocity = 0;
  private color = '#ffffff';
  private cssSize = 0;
  private dpr = 1;
  private frame: number | null = null;
  private baseline = 0;
  private intersecting = true;
  private observer: IntersectionObserver | null = null;
  private listening = false;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    opts: ParticleOptions = {}
  ) {
    this.context = canvas.getContext('2d');
    this.raf = opts.raf ?? ((cb) => requestAnimationFrame(cb));
    this.caf = opts.caf ?? ((id) => cancelAnimationFrame(id));
    this.now = opts.now ?? (() => performance.now());
    this.random = opts.random ?? Math.random;
    this.reducedMotion =
      opts.reducedMotion ??
      (() => {
        if (!this.motionQuery && typeof matchMedia === 'function') {
          const query = matchMedia('(prefers-reduced-motion: reduce)');
          this.motionQuery = query;
          if (
            typeof query.addEventListener === 'function' &&
            typeof query.removeEventListener === 'function'
          ) {
            query.addEventListener('change', this.onMotionChanged);
            this.removeMotionListener = () =>
              query.removeEventListener('change', this.onMotionChanged);
          } else if (
            typeof query.addListener === 'function' &&
            typeof query.removeListener === 'function'
          ) {
            query.addListener(this.onMotionChanged);
            this.removeMotionListener = () => query.removeListener(this.onMotionChanged);
          }
        }
        return this.motionQuery?.matches ?? false;
      });
    const capacity = opts.maxParticles ?? 120;
    this.pool = Array.from(
      { length: Number.isFinite(capacity) ? Math.max(0, Math.floor(capacity)) : 120 },
      () => ({ radius: 0, angle: 0, size: 0, age: 0, lifetime: 0, calmAge: 0, phase: 0 })
    );
  }

  get count(): number {
    return this.live;
  }

  setColor(color: string): void {
    if (this.disposed) return;
    this.color = color;
    this.draw();
    this.syncLoop();
  }

  setDensity(pm25: number | null): void {
    if (this.disposed) return;
    this.population = targetPopulation(pm25, this.pool.length);
    if (this.population === 0) this.carry = 0;
    if (this.reducedMotion()) this.staticField();
    this.syncLoop();
  }

  setSpeed(fraction: number | null): void {
    if (this.disposed) return;
    this.target = fraction === null ? null : clamp(fraction, 0, 1);
    this.syncLoop();
  }

  refreshMotion(): void {
    if (this.disposed) return;
    if (this.reducedMotion()) this.staticField();
    this.syncLoop();
  }

  private readonly onMotionChanged = (): void => this.refreshMotion();

  resize(cssSize: number, dpr = globalThis.devicePixelRatio || 1): void {
    if (this.disposed) return;
    const size = Number.isFinite(cssSize) ? Math.max(0, cssSize) : 0;
    const ratio = Number.isFinite(dpr) && dpr > 0 ? Math.min(2, dpr) : 1;
    const dimension = Math.round(size * ratio);
    if (
      this.cssSize === size &&
      this.dpr === ratio &&
      this.canvas.width === dimension &&
      this.canvas.height === dimension
    )
      return;
    this.cssSize = size;
    this.dpr = ratio;
    if (this.canvas.width !== dimension) this.canvas.width = dimension;
    if (this.canvas.height !== dimension) this.canvas.height = dimension;
    this.canvas.style.width = `${this.cssSize}px`;
    this.canvas.style.height = `${this.cssSize}px`;
    if (this.reducedMotion()) this.staticField();
    else this.draw();
    this.syncLoop();
  }

  private seed(particle: Particle): void {
    particle.radius = SPAWN_MIN + this.random() * (SPAWN_MAX - SPAWN_MIN);
    particle.angle = this.random() * Math.PI * 2;
    particle.size = 1.2 + this.random() * 1.4;
    particle.age = 0;
    particle.lifetime = 4 + this.random() * 3;
    particle.calmAge = 0;
    particle.phase = this.random() * Math.PI * 2;
  }

  private staticField(): void {
    if (!this.context) return;
    const previous = this.live;
    this.live = this.population;
    for (let i = previous; i < this.live; i += 1) {
      this.seed(this.pool[i]);
      this.pool[i].age = 0.4;
    }
    if (previous > 0 && this.live === 0) this.clear();
    this.draw(true);
  }

  step(dtSeconds: number): void {
    if (this.disposed || !this.context || this.reducedMotion()) return;
    const dt = Number.isFinite(dtSeconds) ? clamp(dtSeconds, 0, 0.1) : 0;
    const previous = this.live;
    const easing = 1 - Math.exp(-dt / SPEED_TAU);
    this.effective += ((this.target ?? 0) - this.effective) * easing;
    // Ease the whole velocity, including the running speed floor, not just the fan fraction.
    this.velocity += (inwardSpeed(this.target, 1) - this.velocity) * easing;
    this.carry += (this.population / travelTime(this.target === null ? null : this.effective)) * dt;
    const births = Math.floor(this.carry);
    this.carry -= births;
    const available = Math.min(births, this.pool.length - this.live);
    for (let i = 0; i < available; i += 1) this.seed(this.pool[this.live++]);
    for (let i = 0; i < this.live;) {
      const p = this.pool[i];
      p.age += dt;
      const speed = this.particleSpeed(p);
      p.angle += (0.25 * speed * dt) / Math.max(ABSORB_R, p.radius);
      p.radius -= speed * dt;
      // Running particles expire by absorption; their calm lifetime is spent only while off.
      if (this.target === null) p.calmAge += dt;
      if (p.radius <= ABSORB_R || (this.target === null && p.calmAge >= p.lifetime)) {
        this.live -= 1;
        this.pool[i] = this.pool[this.live];
        this.pool[this.live] = p;
      } else i += 1;
    }
    if (previous > 0 && this.live === 0) this.clear();
    this.draw(false);
  }

  private clear(): void {
    this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private particleSpeed(particle: Particle): number {
    const speed = this.velocity * (1 + 1.5 * (1 - clamp(particle.radius, 0, 1)));
    return this.target === null && speed * Math.hypot(1, 0.25) < STOP_SPEED ? 0 : speed;
  }

  private draw(reduced = this.reducedMotion()): void {
    const ctx = this.context;
    if (!ctx || this.live === 0) return;
    this.clear();
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;
    ctx.lineCap = 'round';
    const radius = (this.cssSize * this.dpr) / 2;
    for (let i = 0; i < this.live; i += 1) {
      const p = this.pool[i];
      const fade = fadeFactor(p.radius);
      const expiry = !reduced ? clamp((p.lifetime - p.calmAge) / 0.6, 0, 1) : 1;
      ctx.globalAlpha = 0.85 * Math.min(1, p.age / 0.4) * fade * expiry;
      // Keep outer-edge spawns inside the canvas without shifting normalized geometry.
      const distance = Math.min(p.radius * radius, Math.max(0, radius - 3 * this.dpr));
      const cos = Math.cos(p.angle);
      const sin = Math.sin(p.angle);
      const x = radius + cos * distance;
      const y = radius + sin * distance;
      const size = p.size * this.dpr * (0.6 + 0.4 * fade);
      const speed = this.particleSpeed(p);
      const streak = clamp((speed - 0.3) / 0.3, 0, 1);
      if (!reduced && streak > 0) {
        const tangent = 0.25 * speed;
        const vx = (-speed * cos - tangent * sin) * radius;
        const vy = (-speed * sin + tangent * cos) * radius;
        const velocity = Math.hypot(vx, vy);
        const length = Math.min(14 * this.dpr, velocity * 0.035) * streak;
        const dx = (-vx / velocity) * length;
        const dy = (-vy / velocity) * length;
        // Three narrowing segments taper the tail without allocating gradients or paths.
        const alpha = ctx.globalAlpha;
        ctx.globalAlpha = alpha * streak;
        for (let segment = 0; segment < 3; segment += 1) {
          ctx.lineWidth = size * (1 - segment / 3);
          ctx.beginPath();
          ctx.moveTo(x + (dx * segment) / 3, y + (dy * segment) / 3);
          ctx.lineTo(x + (dx * (segment + 1)) / 3, y + (dy * (segment + 1)) / 3);
          ctx.stroke();
        }
        ctx.globalAlpha = alpha;
      }
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  observe(host: Element): void {
    if (this.disposed) return;
    this.observer?.disconnect();
    if (typeof IntersectionObserver === 'function') {
      this.intersecting = false;
      this.observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === host) this.intersecting = entry.isIntersecting;
        }
        this.syncLoop();
      });
      this.observer.observe(host);
    }
    if (!this.listening) {
      document.addEventListener('visibilitychange', this.onVisibility);
      this.listening = true;
    }
    this.syncLoop();
  }

  private readonly onVisibility = (): void => this.syncLoop();

  private syncLoop(): void {
    const active =
      !this.disposed &&
      this.context &&
      this.intersecting &&
      !document.hidden &&
      !this.reducedMotion() &&
      (this.live > 0 || this.population > 0);
    if (!active) {
      if (this.frame !== null) this.caf(this.frame);
      this.frame = null;
    } else if (this.frame === null) {
      this.baseline = this.now();
      this.frame = this.raf(this.onFrame);
    }
  }

  private readonly onFrame = (): void => {
    this.frame = null;
    const time = this.now();
    this.step((time - this.baseline) / 1000);
    this.baseline = time;
    this.syncLoop();
  };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.frame !== null) this.caf(this.frame);
    this.frame = null;
    this.observer?.disconnect();
    if (this.listening) document.removeEventListener('visibilitychange', this.onVisibility);
    this.removeMotionListener?.();
    this.removeMotionListener = undefined;
  }
}
