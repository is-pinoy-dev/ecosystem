import { resolveCloudflareCreds, setCloudflareEnv } from "../../utils/cloudflare.js";
import { info, warning, success, divider } from "../../utils/output.js";
import pc from "picocolors";

export async function handleStatus(
  dir: string,
  credsOptions: { apiKey?: string; zoneId?: string },
): Promise<void> {
  const creds = resolveCloudflareCreds(credsOptions);
  setCloudflareEnv(creds);

  const registry = await import("@is-pinoy/registry");
  const domains = registry.loadDomains(dir);
  const records = await registry.listRecords();
  const recordsArray = Array.isArray(records) ? records : [records];
  const actions = registry.diff(domains, recordsArray);

  divider();
  console.log(`  ${pc.bold("Registry Status")}`);
  divider();
  console.log(`  Domains:     ${pc.cyan(String(domains.length))}`);
  console.log(`  DNS Records: ${pc.cyan(String(recordsArray.length))}`);

  if (actions.length === 0) {
    console.log(`  Sync:        ${pc.green("✔ Synced")}`);
  } else {
    console.log(`  Sync:        ${pc.yellow(`⚠ ${actions.length} pending change(s)`)}`);
  }
  divider();

  for (const domain of domains) {
    const domainActions = actions.filter(
      (a) => a.fqdn.startsWith(domain.subdomain + "."),
    );
    const status =
      domainActions.length === 0
        ? pc.green("✔")
        : pc.yellow(`⚠ ${domainActions.length} pending`);
    console.log(`  ${status} ${domain.subdomain}`);
  }
}
