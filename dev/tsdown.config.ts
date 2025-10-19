import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  clean: true,
  shims: true,
  banner: { js: "#!/usr/bin/env node" },
  alias: {
    $commands: "./src/commands",
    $utils: "./src/utils",
    $versioning: "./src/versioning",
    $console: "./src/console",
  },
});
