import chalk from "chalk";

type Echo = Record<
  "info" | "success" | "ok" | "warn" | "text" | "err" | "danger" | "label" | "title",
  (message?: any, ...optionalParams: any[]) => void
>;

export const echo: Echo = {
  /**
   * Red text to stderr
   */
  err(message, ...optionalParams) {
    console.error(chalk.red(message), ...optionalParams);
  },
  /**
   * Red text for recoverable errors (to stdout)
   */
  danger(message, ...optionalParams) {
    console.log(chalk.red(message), ...optionalParams);
  },
  ok(message, ...optionalParams) {
    console.log(chalk.green(message), ...optionalParams);
  },
  success(message, ...optionalParams) {
    console.log(chalk.green.bold(message), ...optionalParams);
  },
  info(message, ...optionalParams) {
    console.log(chalk.cyan(message), ...optionalParams);
  },
  label(message, ...optionalParams) {
    console.log(chalk.blue(message), ...optionalParams);
  },
  title(message, ...optionalParams) {
    console.log(chalk.blue.bold(message), ...optionalParams);
  },
  warn(message, ...optionalParams) {
    console.warn(chalk.yellow(message), ...optionalParams);
  },
  text: console.log,
};
