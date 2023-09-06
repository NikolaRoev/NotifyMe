import { defineConfig } from "@playwright/test";

export default defineConfig({
    testDir: "./test/e2e",
    reporter: process.env.CI ? "github" : "list",
    fullyParallel: true
});
