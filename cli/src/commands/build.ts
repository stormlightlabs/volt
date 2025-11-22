import { echo } from "$utils/echo.js";
import { spawn } from "node:child_process";

/**
 * Builds the VoltX.js project for production using Vite.
 */
export async function buildCommand(options: { outDir?: string } = {}): Promise<void> {
  const outDir = options.outDir || "dist";

  echo.title("\n⚡ Building VoltX.js project for production...\n");

  try {
    const { existsSync } = await import("node:fs");
    if (!existsSync("index.html")) {
      echo.warn("Warning: No index.html found in current directory");
      echo.info("Are you in a VoltX.js project?\n");
    }

    const viteArgs = ["vite", "build", "--outDir", outDir];
    const viteProcess = spawn("npx", viteArgs, { stdio: "inherit", shell: true });

    viteProcess.on("error", (error) => {
      echo.err("Failed to build project:", error);
      process.exit(1);
    });

    viteProcess.on("exit", (code) => {
      if (code === 0) {
        echo.success(`\n✓ Build completed successfully!\n`);
        echo.info(`Output directory: ${outDir}\n`);
      } else if (code !== null) {
        process.exit(code);
      }
    });
  } catch (error) {
    echo.err("Error building project:", error);
    process.exit(1);
  }
}
