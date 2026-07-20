import {
  resolveCloudflareCreds,
  setCloudflareEnv,
} from "../../utils/cloudflare.js";
import { filterDomainsByChangedFiles } from "../../utils/filter.js";
import { info, warning, success, divider, printActionTable } from "../../utils/output.js";

export async function handleDiff(
  dir: string,
  credsOptions: { apiKey?: string; zoneId?: string },
  only?: string[],
): Promise<void> {
  const creds = resolveCloudflareCreds(credsOptions);
  setCloudflareEnv(creds);

  const registry = await import("@is-pinoy-dev/registry");
  let domains = registry.loadDomains(dir);
  info(`Loaded ${domains.length} domain(s) from ${dir}`);

  const scoped = Boolean(only && only.length > 0);
  if (scoped) {
    domains = filterDomainsByChangedFiles(domains, only!);
    info(`Scoped to ${domains.length} changed domain(s) from --only`);
  }

  const records = await registry.listRecords();
  const recordsArray = Array.isArray(records) ? records : [records];
  info(`Fetched ${recordsArray.length} DNS record(s) from Cloudflare`);

  const actions = registry.diff(domains, recordsArray, { scoped });

  if (actions.length === 0) {
    success("No changes needed. All domains are in sync.");
    process.exit(0);
  }

  warning(`${actions.length} change(s) detected:`);
  divider();
  printActionTable(
    actions.map((a) => ({
      type: a.type,
      fqdn: a.fqdn,
      details: "record" in a
        ? `${a.record.type} ${a.record.value}${"proxied" in a.record && a.record.proxied ? " (proxied)" : ""}`
        : undefined,
    })),
  );
  divider();
}
