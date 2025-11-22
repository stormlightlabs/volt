import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/tests/**", "src/**/*.test.ts", "src/index.ts", "src/commands/dev.ts", "src/commands/build.ts"],
      all: true,
      thresholds: { lines: 95, functions: 95, branches: 80, statements: 95 },
    },
  },
  resolve: {
    alias: {
      "$commands": path.resolve(__dirname, "./src/commands"),
      "$templates": path.resolve(__dirname, "./src/templates"),
      "$utils": path.resolve(__dirname, "./src/utils"),
    },
  },
});
