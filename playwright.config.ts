import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  use: {
    baseURL: "https://uat.clinic.neurovi.id/",
    headless: true,
    screenshot: "on",
    video: "retain-on-failure",
    extraHTTPHeaders: {
      Authorization: `${process.env.API_TOKEN}`,
    },
  },
  reporter: [["list"], ["html", { outputFolder: "report" }]],
  retries: 1,
  workers: 4, // parallelization
});
