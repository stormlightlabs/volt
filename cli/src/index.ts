import chalk from "chalk";
import { Command } from "commander";
import { docsCommand } from "./commands/docs.js";
import { statsCommand } from "./commands/stats.js";

const program = new Command();

program.name("volt").description("CLI tools for Volt.js development").version("0.1.0");

program.command("docs").description("Generate API documentation from TypeScript doc comments").action(async () => {
  try {
    await docsCommand();
  } catch (error) {
    console.error(chalk.red("Error generating docs:"), error);
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
    console.error(chalk.red("Error generating stats:"), error);
    process.exit(1);
  }
});

program.parse();
