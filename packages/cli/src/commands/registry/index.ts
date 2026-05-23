import { Command } from "commander";
import { handleValidate } from "./validate.js";

export function registerRegistryCommand(program: Command): void {
  const registry = program
    .command("registry")
    .description("Manage DNS registry");

  registry
    .command("validate")
    .description("Validate domain JSON files")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .action((options) => {
      handleValidate(options.dir);
    });
}
