import chalk from "chalk";

export const logger = {
  success: (message: string) => {
    console.log(`${chalk.green("✅")} ${chalk.green(message)}`);
  },
  error: (message: string) => {
    console.log(`${chalk.red("❌")} ${chalk.red(message)}`);
  },
  warn: (message: string) => {
    console.log(`${chalk.yellow("⚠️")} ${chalk.yellow(message)}`);
  },
  info: (message: string) => {
    console.log(`${chalk.blue("ℹ️")} ${chalk.blue(message)}`);
  },
  // New enhanced feedback methods
  step: (step: number, total: number, message: string) => {
    console.log(`${chalk.cyan(`[${step}/${total}]`)} ${chalk.white(message)}`);
  },
  progress: (message: string) => {
    console.log(`${chalk.magenta("🔄")} ${chalk.magenta(message)}`);
  },
  complete: (message: string) => {
    console.log(`${chalk.green("🎉")} ${chalk.green.bold(message)}`);
  },
  question: (message: string) => {
    console.log(`${chalk.cyan("❓")} ${chalk.cyan(message)}`);
  },
  feature: (feature: string, status: "enabled" | "disabled" | "generated") => {
    const statusColors = {
      enabled: chalk.green("✓ Enabled"),
      disabled: chalk.gray("✗ Disabled"),
      generated: chalk.blue("📝 Generated"),
    };
    console.log(`   ${chalk.white(feature)}: ${statusColors[status]}`);
  },
  summary: (
    title: string,
    items: Array<{ name: string; status: string; details?: string }>
  ) => {
    console.log(`\n${chalk.bold.blue("📋 " + title)}`);
    items.forEach((item) => {
      const statusIcon =
        item.status === "success"
          ? "✅"
          : item.status === "warning"
          ? "⚠️"
          : "❌";
      console.log(
        `   ${statusIcon} ${chalk.white(item.name)}${
          item.details ? chalk.gray(` - ${item.details}`) : ""
        }`
      );
    });
    console.log();
  },
};
