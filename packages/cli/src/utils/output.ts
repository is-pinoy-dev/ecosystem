import pc from "picocolors";
import type { SchemaIssue } from "@is-pinoy/registry";

export function printBanner(version: string): void {
  const label = "is-pinoy.dev";
  const ver = `v${version}`;
  const padding = 2;
  const inner = " ".repeat(padding) + label + "  " + ver + " ".repeat(padding);
  const width = inner.length;
  const line = "─".repeat(width);

  console.log();
  console.log("  " + pc.cyan(`╭${line}╮`));
  console.log(
    "  " +
      pc.cyan("│") +
      " ".repeat(padding) +
      pc.bold(pc.white(label)) +
      "  " +
      pc.dim(ver) +
      " ".repeat(padding) +
      pc.cyan("│"),
  );
  console.log("  " + pc.cyan(`╰${line}╯`));
  console.log();
}

export function success(message: string): void {
  console.log(pc.green(`✔ ${message}`));
}

export function error(message: string): void {
  console.error(pc.red(`✖ ${message}`));
}

export function warning(message: string): void {
  console.log(pc.yellow(`⚠ ${message}`));
}

export function info(message: string): void {
  console.log(pc.cyan(`ℹ ${message}`));
}

export function divider(): void {
  console.log(pc.dim("─".repeat(50)));
}

export interface ActionRow {
  type: string;
  fqdn: string;
  details?: string;
}

export function printSchemaError(file: string, issues: SchemaIssue[]): void {
  error(`Schema error in ${pc.bold(file)}`);
  console.log();
  const colWidth = Math.max(...issues.map((i) => i.path.length), 5);
  console.log(`  ${pc.dim("Field".padEnd(colWidth))}  ${pc.dim("Issue")}`);
  console.log(`  ${pc.dim("─".repeat(colWidth + 2 + 40))}`);
  for (const issue of issues) {
    console.log(`  ${pc.yellow(issue.path.padEnd(colWidth))}  ${issue.message}`);
  }
  console.log();
}

export function printActionTable(actions: ActionRow[]): void {
  for (const action of actions) {
    const icon =
      action.type === "CREATE"
        ? pc.green("+")
        : action.type === "UPDATE"
          ? pc.yellow("~")
          : pc.red("-");
    console.log(
      `  ${icon} ${action.type.padEnd(6)} ${action.fqdn}${action.details ? ` → ${action.details}` : ""}`,
    );
  }
}
