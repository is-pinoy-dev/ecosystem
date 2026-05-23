import { Command } from "commander";
import { handleValidate } from "./validate.js";
import { handleDiff } from "./diff.js";

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

  registry
    .command("diff")
    .description("Show differences between local domains and Cloudflare")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .option("--zone-id <id>", "Cloudflare zone ID (overrides CLOUDFLARE_ZONE_ID env)")
    .option("--api-key <key>", "Cloudflare API token (overrides CLOUDFLARE_API_TOKEN env)")
    .action(async (options) => {
      await handleDiff(options.dir, {
        apiKey: options.apiKey,
        zoneId: options.zoneId,
      });
    });
}
