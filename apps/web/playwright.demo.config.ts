import { defineConfig, devices } from '@playwright/test';

// E2E da demo estática: sem API nem banco. Sobe o build demo com o mesmo caminho base do
// GitHub Pages para exercitar o basename do router e os filtros na URL (nuqs).
const PORT = Number(process.env.PLAYWRIGHT_DEMO_PORT ?? 4174);
const BASE = process.env.VITE_BASE ?? '/Sistema-de-Precatorio/';

export default defineConfig({
  testDir: './e2e-demo',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE}`,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm build:demo && pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE}`,
    env: { VITE_BASE: BASE },
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
