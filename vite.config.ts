import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./test/setupTests.ts",
    globals: true,
    exclude: ["**/node_modules/**", "**/dist/**", "**/cli/tests/**"],
    coverage: {
      provider: "v8",
      thresholds: { functions: 50, branches: 50 },
      include: ["**/src/**"],
      exclude: ["**/cli/src/**"],
    },
  },
});
