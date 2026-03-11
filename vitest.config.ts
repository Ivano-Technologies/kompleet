import { defineConfig, configDefaults } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: process.env.CI ? 30_000 : 5_000,
    hookTimeout: process.env.CI ? 30_000 : 10_000,
    exclude: [
      ...configDefaults.exclude,
      "e2e/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
});
