#!/usr/bin/env node
/* eslint-disable unicorn/no-process-exit */
import { buildCommand } from "$commands/build.js";
import { devCommand } from "$commands/dev.js";
import { downloadCommand } from "$commands/download.js";
import { initCommand } from "$commands/init.js";
import { echo } from "$utils/echo.js";
import { Command } from "commander";

const program = new Command();
const isCreateMode = process.argv[1]?.includes("create-voltx");

program.name(isCreateMode ? "create-voltx" : "voltx").description("CLI for creating and managing VoltX.js applications")
  .version("0.1.0");

program.command("init [project-name]").description("Create a new VoltX.js project").action(
  async (projectName: string | undefined) => {
    try {
      await initCommand(projectName);
    } catch (error) {
      echo.err("Error creating project:", error);
      process.exit(1);
    }
  },
);

program.command("dev").description("Start development server").option(
  "-p, --port <port>",
  "Port to run the dev server on",
  "3000",
).option("-o, --open", "Open browser automatically", false).action(
  async (options: { port?: string; open?: boolean }) => {
    try {
      const port = options.port ? Number.parseInt(options.port, 10) : 3000;
      await devCommand({ port, open: options.open });
    } catch (error) {
      echo.err("Error starting dev server:", error);
      process.exit(1);
    }
  },
);

program.command("build").description("Build project for production").option("--out <dir>", "Output directory", "dist")
  .action(async (options: { out?: string }) => {
    try {
      await buildCommand({ outDir: options.out });
    } catch (error) {
      echo.err("Error building project:", error);
      process.exit(1);
    }
  });

program.command("download").description("Download VoltX.js assets (JS and CSS)").option(
  "--version <version>",
  "VoltX.js version to download",
  "latest",
).option("--no-js", "Skip downloading JavaScript file").option("--no-css", "Skip downloading CSS file").option(
  "-o, --output <dir>",
  "Output directory",
  ".",
).action(async (options: { version?: string; js?: boolean; css?: boolean; output?: string }) => {
  try {
    await downloadCommand(options);
  } catch (error) {
    echo.err("Error downloading assets:", error);
    process.exit(1);
  }
});

if (isCreateMode && process.argv.length === 2) {
  initCommand().catch((error) => {
    echo.err("Error:", error);
    process.exit(1);
  });
} else if (isCreateMode && process.argv.length === 3 && !process.argv[2]?.startsWith("-")) {
  initCommand(process.argv[2]).catch((error) => {
    echo.err("Error:", error);
    process.exit(1);
  });
} else {
  program.parse();
}
