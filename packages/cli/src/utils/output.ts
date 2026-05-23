import pc from "picocolors";

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
