import {
  resolveCloudflareCreds,
  setCloudflareEnv,
} from "../../utils/cloudflare.js";
import { info, warning, success, divider, printActionTable } from "../../utils/output.js";

export async function handleDiff(
  dir: string,
  credsOptions: { apiKey?: string; zoneId?: string },
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

  warning(`${actions.length} change(s) detected:`);
  divider();
  printActionTable(actions);
  divider();
}
