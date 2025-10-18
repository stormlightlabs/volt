/* eslint-disable unicorn/no-process-exit */
import { buildCommand } from "$commands/build.js";
import { cssDocsCommand } from "$commands/css-docs.js";
import { docsCommand } from "$commands/docs.js";
import { type BuildMode, exampleCommand } from "$commands/example.js";
import { statsCommand } from "$commands/stats.js";
import { echo } from "$console/echo.js";
import { Command } from "commander";

const program = new Command();

program.name("volt").description("CLI tools for Volt.js development").version("0.1.0");

program.command("docs").description("Generate API documentation from TypeScript doc comments").action(async () => {
  try {
    await docsCommand();
  } catch (error) {
    echo.err("Error generating docs:", error);
    process.exit(1);
  }
});

program.command("stats").description("Display lines of code statistics").option(
  "--full",
  "Include test files in the count",
).action(async (options) => {
  try {
    await statsCommand(options.full);
  } catch (error) {
    echo.err("Error generating stats:", error);
    process.exit(1);
  }
});

program.command("build [outDir]").description("Build the library and output to a directory").option(
  "--no-minify",
  "Skip minification (outputs volt.js instead of volt.min.js)",
).option("--no-css", "Skip CSS output").action(
  async (outDir: string | undefined, options: { minify: boolean; css: boolean }) => {
    try {
      await buildCommand(outDir, options);
    } catch (error) {
      echo.err("Error building library:", error);
      process.exit(1);
    }
  },
);

program.command("css-docs").description("Generate CSS documentation from base.css comments and variables").action(
  async () => {
    try {
      await cssDocsCommand();
    } catch (error) {
      echo.err("Error generating CSS docs:", error);
      process.exit(1);
    }
  },
);

const example = program.command("example").description("Manage examples for Volt.js");

example.command("new <name>").description("Create a new example with scaffolded files").option(
  "--mode <mode>",
  "Example mode: markup (declarative) or programmatic (imperative)",
  "programmatic",
).option("--standalone", "Create standalone example with local copies of volt.min.js and volt.min.css", false).action(
  async (name: string, options: { mode: BuildMode; standalone: boolean }) => {
    try {
      await exampleCommand(name, options);
    } catch (error) {
      echo.err("Error creating example:", error);
      process.exit(1);
    }
  },
);

program.parse();
