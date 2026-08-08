import { fetchSubdomains } from "./src/github";
import { fetchAnalytics, isBeyondRetention } from "./src/graphql";
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
 * Bounded by what the zone will actually serve, not by what we would like. Its
 * analytics retention is currently about **eight days** — a thirty-day window
 * collected seven days and spent the other twenty-three subrequests being told
 * the data no longer exists. Ten keeps a little margin over the observed limit
 * without paying for a fortnight of certain misses.
 *
 * Retention is plan-dependent and can change, so this number is not
 * load-bearing: anything past it is skipped rather than failed (see
 * `isBeyondRetention`). Raise it if the plan changes, but expect the extra days
 * to be skips rather than data.
 *
 * **Subrequest budget.** A Worker on the free plan gets 50 external subrequests
 * per invocation (D1 has its own, far larger, internal allowance). One run
 * spends 1 on the registry read plus 1 per date. Raising this past ~45 puts the
 * run back into "Too many subrequests by single Worker invocation".
 */
const MAX_BACKFILL_DAYS = 10;

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
    // next run picks up whatever is still missing. Real failures are re-thrown
    // at the end so the invocation is recorded as failed rather than silently
    // half-done.
    //
    // A day the zone no longer retains is not a failure — it is data that no
    // longer exists, and no retry will bring it back. Those are counted apart
    // so they neither fail the run nor pass unmentioned.
    const failures: string[] = [];
    let expired = 0;
    let collected = 0;

    for (const date of dates) {
      try {
        const rows = await fetchAnalytics(env.CF_API_TOKEN, env.CF_ZONE_ID, date);
        await persistSnapshots(env.ANALYTICS_DB, subdomains, rows, date);
        collected++;
      } catch (error) {
        if (isBeyondRetention(error)) {
          expired++;
          continue;
        }
        failures.push(`${date}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const expiredNote = expired > 0 ? `; ${expired} beyond zone retention` : "";

    if (failures.length > 0) {
      throw new Error(
        `Collected ${collected}/${dates.length} days${expiredNote}; failed: ${failures.join("; ")}`
      );
    }

    if (expired > 0) {
      console.log(`Collected ${collected}/${dates.length} days${expiredNote}`);
    }
  },
} satisfies ExportedHandler<Env>;
