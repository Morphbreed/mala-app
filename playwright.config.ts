import { defineConfig, devices } from '@playwright/test'

const PORT = 5173
const baseURL = `http://localhost:${PORT}/`

/**
 * Die Tests fahren die App über den Dev-Server — nur dort gibt es den
 * `window.__mala`-Hook, mit dem sich Rillen punktgenau treffen lassen.
 *
 * Brave ist Chromium-basiert, deshalb reicht das eine Projekt. Für Firefox
 * zusätzlich `npx playwright install firefox` und ein zweites Projekt.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL,
    viewport: { width: 1280, height: 820 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: baseURL,
    reuseExistingServer: true,
    timeout: 60_000,
  },
})
