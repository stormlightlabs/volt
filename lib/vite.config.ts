import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { type ViteUserConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const test: ViteUserConfig["test"] = {
  environment: "jsdom",
  setupFiles: "./test/setupTests.ts",
  globals: true,
  watch: false,
  exclude: ["**/node_modules/**", "**/dist/**", "**/cli/tests/**"],
  silent: true,
  reporters: ["dot"],
  coverage: {
    provider: "v8",
    thresholds: { functions: 50, branches: 50 },
    include: ["**/src/**"],
    exclude: ["**/cli/src/**", "**/src/main.ts"],
  },
};

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      "$types": path.resolve(__dirname, "./src/types"),
      "$volt": path.resolve(__dirname, "./src/index.ts"),
      "$core": path.resolve(__dirname, "./src/core"),
      "$plugins": path.resolve(__dirname, "./src/plugins"),
      "$debug": path.resolve(__dirname, "./src/debug"),
      "$vebug": path.resolve(__dirname, "./src/debug.ts"),
    },
  },
  build: mode === "lib"
    ? {
      lib: { entry: path.resolve(__dirname, "src/index.ts"), name: "Volt", fileName: "volt", formats: ["es"] },
      rolldownOptions: { output: { assetFileNames: "volt.[ext]" } },
    }
    : undefined,
  test,
}));
