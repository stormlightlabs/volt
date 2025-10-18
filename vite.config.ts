import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "$types": path.resolve(__dirname, "./src/types"),
      "@volt/core": path.resolve(__dirname, "./src/core"),
      "@volt/plugins": path.resolve(__dirname, "./src/plugins"),
    },
  },
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
