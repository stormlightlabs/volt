import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./test/setupTests.ts",
    globals: true,
    coverage: { provider: "v8", thresholds: { "perFile": true, functions: 50, branches: 50, autoUpdate: true } },
  },
});
