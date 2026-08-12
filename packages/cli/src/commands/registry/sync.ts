import {
  resolveCloudflareCreds,
  setCloudflareEnv,
} from "../../utils/cloudflare.js";
import { filterDomainsByChangedFiles } from "../../utils/filter.js";
import {
  info,
  warning,
  success,
  error,
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
  dryRun: boolean,
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

  // Hosted portfolios also need a Workers route each (see core/routes.ts).
  // Skipped entirely when PORTFOLIO_WORKER is unset, which is why the route
  // listing is only fetched when it's set.
  let routeActions: Awaited<ReturnType<typeof loadRouteActions>> = [];
  async function loadRouteActions() {
    if (!process.env.PORTFOLIO_WORKER) return [];
    const routes = await registry.listWorkerRoutes();
    const routesArray = Array.isArray(routes) ? routes : [routes];
    info(`Fetched ${routesArray.length} Worker route(s) from Cloudflare`);
    return registry.diffWorkerRoutes(domains, routesArray, { scoped });
  }
  routeActions = await loadRouteActions();

  if (actions.length === 0 && routeActions.length === 0) {
    success("No changes needed. All domains are in sync.");
    process.exit(0);
  }

  warning(`${actions.length + routeActions.length} change(s) to apply:`);
  divider();
  printActionTable([
    ...actions.map((a) => ({
      type: a.type,
      fqdn: a.fqdn,
      details: "record" in a
        ? `${a.record.type} ${a.record.value}${"proxied" in a.record && a.record.proxied ? " (proxied)" : ""}`
        : undefined,
    })),
    ...routeActions.map((a) => ({
      type: a.type,
      fqdn: a.pattern,
      details: a.type === "CREATE_ROUTE" ? `worker ${a.script}` : undefined,
    })),
  ]);
  divider();

  if (dryRun) {
    info("Dry run — no changes applied.");
    process.exit(0);
  }

  if (!autoConfirm) {
    const ok = await confirmAction(actions.length + routeActions.length);
    if (!ok) {
      info("Sync cancelled.");
      process.exit(0);
    }
  }

  const failedRecords = await registry.sync(actions);
  // After the DNS records, so a portfolio's route is never live before the
  // name it routes resolves.
  const failedRoutes =
    routeActions.length > 0
      ? await registry.syncWorkerRoutes(routeActions)
      : 0;

  // A partly-applied sync used to end in "Sync complete." and exit 0, so a
  // token missing one permission left a green workflow behind a broken zone.
  // A stranded portfolio is the loudest version of that: its DNS record is
  // live and its route is not, which serves 525 rather than nothing.
  if (failedRecords > 0 || failedRoutes > 0) {
    error(
      `Sync incomplete: ${failedRecords} record change(s) and ${failedRoutes} route change(s) failed — see the errors above.`,
    );
    if (failedRoutes > 0) {
      error(
        "A hosted portfolio whose Workers route is missing serves HTTP 525 until it exists. Check that CLOUDFLARE_API_TOKEN carries the Workers Routes edit permission, then sync again.",
      );
    }
    process.exit(1);
  }

  success("Sync complete.");
  process.exit(0);
}
