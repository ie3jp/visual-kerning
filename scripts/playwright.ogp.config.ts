import { defineConfig } from '@playwright/test'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

export default defineConfig({
  testDir: '.',
  testMatch: 'record-ogp.ts',
  timeout: 120_000,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    headless: true,
  },
  webServer: {
    command: `npx vite --port 5174 --host 127.0.0.1`,
    cwd: resolve(ROOT, 'docs/recorder'),
    url: 'http://127.0.0.1:5174/content.html',
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
