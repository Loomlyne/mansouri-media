import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL ?? "http://localhost:8791";

export default defineConfig({
  testDir: "e2e",
  snapshotPathTemplate: "e2e/__signed__/{arg}{ext}",
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.03, animations: "disabled" },
  },
  use: { baseURL },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "bash scripts/preview-local.sh",
        url: "http://localhost:8791/logo-plum.png",
        reuseExistingServer: false,
        timeout: 300000,
      },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "pixel7", use: { ...devices["Pixel 7"] } },
    { name: "iphone15", use: { ...devices["iPhone 15"] } },
  ],
});
