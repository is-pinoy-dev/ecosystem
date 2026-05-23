import {
  resolveCloudflareCreds,
  setCloudflareEnv,
} from "../../utils/cloudflare.js";
import {
  info,
  warning,
  success,
  divider,
  printActionTable,
} from "../../utils/output.js";

async function confirmAction(count: number): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(`Apply ${count} change(s) to Cloudflare? (y/N) `);
    process.stdin.once("data", (data) => {
      const input = data.toString().trim().toLowerCase();
      resolve(input === "y" || input === "yes");
    });
  });
}

export async function handleSync(
  dir: string,
  credsOptions: { apiKey?: string; zoneId?: string },
  autoConfirm: boolean,
): Promise<void> {
  const creds = resolveCloudflareCreds(credsOptions);
  setCloudflareEnv(creds);

  const registry = await import("@is-pinoy/registry");
  const domains = registry.loadDomains(dir);
  info(`Loaded ${domains.length} domain(s) from ${dir}`);

  const records = await registry.listRecords();
  const recordsArray = Array.isArray(records) ? records : [records];
  info(`Fetched ${recordsArray.length} DNS record(s) from Cloudflare`);

  const actions = registry.diff(domains, recordsArray);

  if (actions.length === 0) {
    success("No changes needed. All domains are in sync.");
    process.exit(0);
  }

  warning(`${actions.length} change(s) to apply:`);
  divider();
  printActionTable(actions);
  divider();

  if (!autoConfirm) {
    const ok = await confirmAction(actions.length);
    if (!ok) {
      info("Sync cancelled.");
      process.exit(0);
    }
  }

  await registry.sync(actions);
  success("Sync complete.");
}
