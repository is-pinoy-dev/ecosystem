import { fetchSubdomains } from "./src/github";
import { fetchAnalytics } from "./src/graphql";
import { latestStoredDate, persistSnapshots } from "./src/db";
import { pendingDates } from "./src/dates";

export interface Env {
  ANALYTICS_DB: D1Database;
  CF_API_TOKEN: string;
  CF_ZONE_ID: string;
  /**
   * Optional in the type, effectively required in production: without it the
   * registry listing is rate limited per shared Worker IP and 403s. See
   * src/github.ts.
   */
  GITHUB_TOKEN?: string;
}

/**
 * How far back a single invocation will reach.
 *
 * Sized for the initial backfill and for recovering from an outage of up to a
 * month. Each day costs one GraphQL request, and the zone's analytics retention
 * is finite and plan-dependent — beyond it the API returns nothing, so a larger
 * window would just spend requests to learn the same thing on every run.
 */
const MAX_BACKFILL_DAYS = 30;

export default {
  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const dates = pendingDates(
      await latestStoredDate(env.ANALYTICS_DB),
      new Date(),
      MAX_BACKFILL_DAYS
    );
    if (dates.length === 0) return;

    // Fetched once and reused for every date. The opt-out is whatever the
    // registry says today, deliberately: a subdomain that switched analytics
    // off must not have history written for it by a backfill that happens to
    // run afterwards.
    const subdomains = await fetchSubdomains(env.GITHUB_TOKEN);
    if (subdomains.length === 0) {
      throw new Error("Empty subdomain list from GitHub — aborting to avoid data loss");
    }

    // One date's failure must not discard the others: the writes are keyed on
    // the date and idempotent, so the days that did land stay landed and the
    // next run picks up whatever is still missing. Failures are re-thrown at
    // the end so the invocation is recorded as failed rather than silently
    // half-done.
    const failures: string[] = [];
    for (const date of dates) {
      try {
        const rows = await fetchAnalytics(env.CF_API_TOKEN, env.CF_ZONE_ID, date);
        await persistSnapshots(env.ANALYTICS_DB, subdomains, rows, date);
      } catch (error) {
        failures.push(`${date}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (failures.length > 0) {
      throw new Error(
        `Collected ${dates.length - failures.length}/${dates.length} days; failed: ${failures.join("; ")}`
      );
    }
  },
} satisfies ExportedHandler<Env>;
