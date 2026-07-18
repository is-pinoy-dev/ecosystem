import { Command } from "commander";
import { handleValidate } from "./validate.js";
import { handleDiff } from "./diff.js";
import { handleSync } from "./sync.js";
import { handleStatus } from "./status.js";

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
    .option(
      "--only <files...>",
      "Restrict the diff to the given changed domain files (e.g. from git diff)",
    )
    .action(async (options) => {
      await handleDiff(
        options.dir,
        {
          apiKey: options.apiKey,
          zoneId: options.zoneId,
        },
        options.only,
      );
    });

  registry
    .command("sync")
    .description("Apply domain changes to Cloudflare")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .option("--zone-id <id>", "Cloudflare zone ID (overrides CLOUDFLARE_ZONE_ID env)")
    .option("--api-key <key>", "Cloudflare API token (overrides CLOUDFLARE_API_TOKEN env)")
    .option("-y, --yes", "Skip confirmation prompt")
    .option("--dry-run", "Preview changes without applying them")
    .option(
      "--only <files...>",
      "Restrict the sync to the given changed domain files (e.g. from git diff)",
    )
    .action(async (options) => {
      await handleSync(
        options.dir,
        { apiKey: options.apiKey, zoneId: options.zoneId },
        options.yes,
        options.dryRun,
        options.only,
      );
    });

  registry
    .command("status")
    .description("Show registry status overview")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .option("--zone-id <id>", "Cloudflare zone ID (overrides CLOUDFLARE_ZONE_ID env)")
    .option("--api-key <key>", "Cloudflare API token (overrides CLOUDFLARE_API_TOKEN env)")
    .action(async (options) => {
      await handleStatus(options.dir, {
        apiKey: options.apiKey,
        zoneId: options.zoneId,
      });
    });
}
