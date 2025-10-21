import path from "node:path";
import { fileURLToPath } from "node:url";
import { type BuildEnvironmentOptions, defineConfig, type LibraryOptions } from "vite";
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
  const [baseMode, ...flags] = mode.split(":");
  const isLibBuild = baseMode === "lib";
  const shouldMinify = flags.includes("min");
  const target = flags.find((flag) => flag !== "min") ?? "all";

  if (!isLibBuild) return { minify: shouldMinify ? "oxc" : false };

  const entry: LibraryOptions["entry"] = {};
  if (target === "all" || target === "voltx") entry.voltx = path.resolve(__dirname, "src/index.ts");
  if (target === "all" || target === "debug") entry.debug = path.resolve(__dirname, "src/debug.ts");

  if (Object.keys(entry).length === 0) {
    entry.voltx = path.resolve(__dirname, "src/index.ts");
  }

  const lib: BuildEnvironmentOptions["lib"] = {
    entry,
    name: "VoltX",
    formats: ["es"],
    fileName: (format, entryName) => {
      const suffix = shouldMinify ? ".min.js" : ".js";
      return `${entryName}${suffix}`;
    },
  };

  const rolldownOptions: BuildEnvironmentOptions["rolldownOptions"] = {
    output: { assetFileNames: "voltx.[ext]" },
    onwarn(warning, warn) {
      if (warning.code === "UNUSED_EXTERNAL_IMPORT") return;
      warn(warning);
    },
  };

  return { minify: shouldMinify ? "oxc" : false, lib, rolldownOptions };
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
  build: { ...buildOptions(mode), emptyOutDir: false },
  test,
  plugins: [],
}));
