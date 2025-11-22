import { echo } from "$utils/echo.js";
import { spawn } from "node:child_process";

/**
 * Starts a Vite development server for the current project.
 */
export async function devCommand(options: { port?: number; open?: boolean } = {}): Promise<void> {
  const port = options.port || 3000;
  const shouldOpen = options.open || false;

  echo.title("\n⚡ Starting VoltX.js development server...\n");

  try {
    const { existsSync } = await import("node:fs");
    if (!existsSync("index.html")) {
      echo.warn("Warning: No index.html found in current directory");
      echo.info("Are you in a VoltX.js project?\n");
    }

    const viteArgs = ["vite", "--port", port.toString(), "--host"];

    if (shouldOpen) {
      viteArgs.push("--open");
    }

    const viteProcess = spawn("npx", viteArgs, { stdio: "inherit", shell: true });

    viteProcess.on("error", (error) => {
      echo.err("Failed to start dev server:", error);
      process.exit(1);
    });

    viteProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        process.exit(code);
      }
    });

    process.on("SIGINT", () => {
      viteProcess.kill("SIGINT");
      process.exit(0);
    });
  } catch (error) {
    echo.err("Error starting dev server:", error);
    process.exit(1);
  }
}
