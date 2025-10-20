import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BuildEnvironmentOptions, defineConfig } from "vite";
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
    reporter: ["text", "json-summary", "html", "lcov", "json"],
    thresholds: { functions: 50, branches: 50 },
    include: ["**/src/**"],
    exclude: ["**/cli/src/**", "**/src/main.ts", "**/src/demo/**"],
  },
};

const buildOptions = (mode: string): BuildEnvironmentOptions => ({
  minify: mode === "lib" ? "oxc" : true,
  ...(mode === "lib"
    ? {
      lib: {
        entry: { voltx: path.resolve(__dirname, "src/index.ts"), debug: path.resolve(__dirname, "src/debug.ts") },
        name: "VoltX",
        formats: ["es"],
      },
      rolldownOptions: { output: { assetFileNames: "voltx.[ext]", minify: true } },
    }
    : {}),
});

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
  build: buildOptions(mode),
  test,
  plugins: [],
}));
