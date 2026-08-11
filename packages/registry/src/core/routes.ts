import {
  type Domain,
  type CloudflareWorkerRoute,
  type RouteAction,
} from "@is-pinoy-dev/schemas";
import { env } from "./env.js";
import {
  createWorkerRoute,
  deleteWorkerRoute,
} from "../providers/cloudflare/client.js";

// Hosted portfolios are served by a Worker rather than reaching the renderer
// directly, because Vercel routes on the Host header and only recognises
// hostnames registered on the project. Registering each claimed subdomain
// there is capped (50 per project on the free plan) and a wildcard domain
// needs Vercel's nameservers, which the zone can't give up. The Worker instead
// forwards to a hostname Vercel already owns and carries the label in a
// header, so the only per-claim provisioning is a Workers route — and those
// are created here, by the same sync that writes the DNS record.
//
// One route per portfolio, never `*.is-pinoy.dev/*`: the wildcard would put
// this Worker in front of every proxied subdomain in the registry, including
// the ~40 that point at their owners' own hosts.

/** The route pattern that sends a claimed portfolio subdomain to the Worker. */
export function portfolioRoutePattern(subdomain: string): string {
  return `${subdomain}.${env("DOMAIN")}/*`;
}

/** Inverse of `portfolioRoutePattern`, or null if the pattern isn't one of ours. */
function subdomainFromPattern(pattern: string): string | null {
  const host = pattern.split("/")[0] ?? "";
  const suffix = `.${env("DOMAIN")}`;
  if (!host.endsWith(suffix)) return null;
  const label = host.slice(0, -suffix.length);
  return label && !label.includes(".") ? label : null;
}

export interface RouteDiffOptions {
  /**
   * Mirrors `DiffOptions.scoped`. Under `--only`, `desired` is a subset of the
   * registry, so a route belonging to a subdomain we weren't handed is unknown
   * rather than orphaned and must not be deleted — otherwise a scoped sync
   * would tear down every other portfolio's route.
   */
  scoped?: boolean;
}

/**
 * Reconcile Workers routes for hosted portfolios.
 *
 * Returns no actions at all when `PORTFOLIO_WORKER` is unset, so a sync run
 * from an environment that predates this feature is a no-op rather than a
 * teardown. Only routes bound to that script are ever considered: the zone
 * also carries the `_tools/*` and status routes, and those belong to other
 * Workers that this must never touch.
 */
export function diffWorkerRoutes(
  desired: Domain[],
  actual: CloudflareWorkerRoute[],
  options: RouteDiffOptions = {},
): RouteAction[] {
  const script = env("PORTFOLIO_WORKER");
  if (!script) {
    // Skipping reconciliation is only harmless when there is nothing to
    // reconcile. A hosted portfolio's CNAME points at the renderer, and the
    // renderer's host only holds a certificate for its own name — the route is
    // what rewrites the request onto it. Without the route Cloudflare goes
    // straight to that origin under the portfolio's own hostname, the TLS
    // handshake fails, and the address serves HTTP 525 with nothing in any log
    // to say why. Never a teardown, but never silent either.
    const stranded = desired
      .filter((d) => d.portfolio && !d.destroy)
      .map((d) => d.subdomain);
    if (stranded.length) {
      console.warn(
        `WARNING: PORTFOLIO_WORKER is unset, so no Workers route was reconciled for ${stranded.length} hosted portfolio(s): ${stranded.join(", ")}. ` +
          `Each will serve HTTP 525 (SSL handshake failed) until its route exists. ` +
          `Set PORTFOLIO_WORKER to the deployed Worker script name and sync again.`,
      );
    }
    return [];
  }

  const actions: RouteAction[] = [];

  const desiredPatterns = new Set(
    desired
      .filter((d) => d.portfolio && !d.destroy)
      .map((d) => portfolioRoutePattern(d.subdomain)),
  );

  const inScope = new Set(desired.map((d) => d.subdomain));
  const ours = actual.filter((r) => r.script === script);
  const existingPatterns = new Set(ours.map((r) => r.pattern));

  for (const pattern of desiredPatterns) {
    if (!existingPatterns.has(pattern)) {
      actions.push({ type: "CREATE_ROUTE", pattern, script });
    }
  }

  for (const route of ours) {
    if (desiredPatterns.has(route.pattern)) continue;
    const subdomain = subdomainFromPattern(route.pattern);
    // A route bound to our script that doesn't map to a subdomain of the zone
    // was created by hand. Leave it alone rather than guessing.
    if (subdomain === null) continue;
    if (options.scoped && !inScope.has(subdomain)) continue;
    actions.push({ type: "DELETE_ROUTE", id: route.id, pattern: route.pattern });
  }

  return actions;
}

function logRouteAction(action: RouteAction) {
  switch (action.type) {
    case "CREATE_ROUTE":
      console.log(
        `[DRY RUN] CREATE_ROUTE ${action.pattern} → ${action.script}`,
      );
      break;
    case "DELETE_ROUTE":
      console.log(`[DRY RUN] DELETE_ROUTE ${action.pattern} (${action.id})`);
      break;
  }
}

function executeRouteAction(action: RouteAction): Promise<string> {
  switch (action.type) {
    case "CREATE_ROUTE":
      return createWorkerRoute(action.pattern, action.script).then(
        () => `CREATED ROUTE ${action.pattern}`,
      );
    case "DELETE_ROUTE":
      return deleteWorkerRoute(action.id).then(
        () => `DELETED ROUTE ${action.pattern}`,
      );
  }
}

export async function syncWorkerRoutes(
  actions: RouteAction[],
  isDryRun = false,
) {
  if (isDryRun) {
    actions.forEach(logRouteAction);
    return;
  }

  const results = await Promise.allSettled(actions.map(executeRouteAction));

  for (const result of results) {
    if (result.status === "fulfilled") {
      console.log(result.value);
    } else {
      console.error(`FAILED: ${String(result.reason)}`);
    }
  }
}
