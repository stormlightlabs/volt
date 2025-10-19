import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: { exclude: [], watch: false },
  resolve: {
    alias: {
      $commands: path.resolve(__dirname, "./src/commands"),
      $utils: path.resolve(__dirname, "./src/utils"),
      $versioning: path.resolve(__dirname, "./src/versioning"),
      $console: path.resolve(__dirname, "./src/console"),
    },
  },
});
