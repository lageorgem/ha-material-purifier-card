import { playwrightLauncher } from '@web/test-runner-playwright';
import { esbuildPlugin } from '@web/dev-server-esbuild';

// Local system Chrome; CI uses Playwright's bundled chromium.
const launchOptions = process.env.CI ? {} : { channel: 'chrome' };

export default {
  files: 'test/unit/**/*.test.ts',
  nodeResolve: true,
  concurrency: 1,
  browsers: [playwrightLauncher({ product: 'chromium', launchOptions })],
  plugins: [esbuildPlugin({ ts: true, tsconfig: 'tsconfig.json', target: 'es2021' })],
  testFramework: { config: { timeout: '8000', retries: 0 } },
  coverage: true,
  coverageConfig: {
    include: ['src/**/*.ts'],
    exclude: ['src/**/*.d.ts'],
    reportDir: 'coverage',
    reporters: ['lcov', 'text-summary'],
    threshold: { statements: 90, branches: 85, functions: 90, lines: 90 },
  },
};
