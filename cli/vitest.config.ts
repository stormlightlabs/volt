import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { globals: true, environment: "node" },
  resolve: {
    alias: {
      "$commands": path.resolve(__dirname, "./src/commands"),
      "$templates": path.resolve(__dirname, "./src/templates"),
      "$utils": path.resolve(__dirname, "./src/utils"),
    },
  },
});
