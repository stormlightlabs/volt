import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  dts: true,
  shims: true,
  platform: "node",
  target: "node18",
  tsconfig: "./tsconfig.json",
});
