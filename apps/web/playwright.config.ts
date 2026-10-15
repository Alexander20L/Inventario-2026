import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../..", import.meta.url));

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:3101",
    browserName: "chromium",
    channel: process.env.PLAYWRIGHT_CHANNEL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "pnpm --filter api start:prod",
      cwd: root,
      env: { PORT: "3100" },
      url: "http://localhost:3100/health/database",
      reuseExistingServer: false,
      timeout: 60000,
    },
    {
      command: "pnpm --filter web exec next start --port 3101",
      cwd: root,
      env: { API_URL: "http://127.0.0.1:3100" },
      url: "http://localhost:3101/iniciar-sesion",
      reuseExistingServer: false,
      timeout: 60000,
    },
  ],
});
