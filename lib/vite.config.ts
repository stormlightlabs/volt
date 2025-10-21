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

const buildOptions = (mode: string): BuildEnvironmentOptions => {
  const isLibBuild = mode === "lib" || mode === "lib:min";
  const shouldMinify = mode === "lib:min";

  return {
    minify: shouldMinify ? "oxc" : false,
    ...(isLibBuild
      ? {
        lib: {
          entry: { voltx: path.resolve(__dirname, "src/index.ts"), debug: path.resolve(__dirname, "src/debug.ts") },
          name: "VoltX",
          formats: ["es"],
          fileName: (format, entryName) => {
            const suffix = shouldMinify ? ".min.js" : ".js";
            return `${entryName}${suffix}`;
          },
        },
        rolldownOptions: {
          output: { assetFileNames: "voltx.[ext]", manualChunks: undefined, preserveModules: false },
          onwarn(warning, warn) {
            if (warning.code === "UNUSED_EXTERNAL_IMPORT") return;
            warn(warning);
          },
        },
      }
      : {}),
  };
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
  build: {
    ...buildOptions(mode),
    emptyOutDir: false, // Don't clear dist/ to preserve TypeScript declarations
  },
  test,
  plugins: [],
}));
