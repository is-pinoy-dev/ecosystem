import type { AnalyticsRow } from "./types";

/**
 * Newest day already collected, or null when the table is empty.
 *
 * Read from `visits_daily` rather than a bookkeeping table so the answer can
 * never disagree with the data itself — a run that wrote rows is a run that
 * counts, however it terminated afterwards.
 */
export async function latestStoredDate(db: D1Database): Promise<string | null> {
  const row = await db
    .prepare("SELECT MAX(date) AS date FROM visits_daily")
    .first<{ date: string | null }>();
  return row?.date ?? null;
}

export async function persistSnapshots(
  db: D1Database,
  subdomains: string[],
  rows: AnalyticsRow[],
  date: string
): Promise<number> {
  if (rows.length === 0) return 0;

  const allowed = new Set(subdomains);

  const bySubdomain = new Map<string, AnalyticsRow[]>();
  for (const row of rows) {
    const parts = row.host.split(".");
    if (parts.length <= 2) continue;
    const subdomain = parts.slice(0, parts.length - 2).join(".");
    if (!allowed.has(subdomain)) continue;
    const bucket = bySubdomain.get(subdomain) ?? [];
    bucket.push(row);
    bySubdomain.set(subdomain, bucket);
  }

  if (bySubdomain.size === 0) return 0;

  const totalStmts: D1PreparedStatement[] = [];
  // Country rows are cleared for each (subdomain, date) before the fresh set is
  // written. INSERT OR REPLACE only touches keys it is given, so a re-collected
  // day that no longer reports a country would leave that country's old row
  // behind — and the breakdown would then sum to more than the day's total it
  // sits under. `visits_daily` needs no equivalent: it is one row per key, so
  // replacing it is already complete.
  //
  // Scoped to the pairs actually being written rather than to the whole date.
  // Deleting everything for a date and re-inserting would also clear a
  // subdomain absent from this response, but a truncated or partial response
  // would then destroy real history — and the GraphQL query has a row limit
  // that makes that possible. Leaving a stale row is recoverable; deleting a
  // real one is not.
  const clearStmts: D1PreparedStatement[] = [];
  const countryStmts: D1PreparedStatement[] = [];

  for (const [subdomain, subRows] of bySubdomain) {
    const total = subRows.reduce((sum, r) => sum + r.requests, 0);
    clearStmts.push(
      db
        .prepare(
          "DELETE FROM visits_daily_by_country WHERE subdomain = ? AND date = ?"
        )
        .bind(subdomain, date)
    );
    totalStmts.push(
      db
        .prepare(
          "INSERT OR REPLACE INTO visits_daily (subdomain, date, visits) VALUES (?, ?, ?)"
        )
        .bind(subdomain, date, total)
    );
    for (const row of subRows) {
      countryStmts.push(
        db
          .prepare(
            "INSERT OR REPLACE INTO visits_daily_by_country (subdomain, date, country, visits) VALUES (?, ?, ?, ?)"
          )
          .bind(subdomain, date, row.country, row.requests)
      );
    }
  }

  // Order matters: D1 runs a batch sequentially, so every clear has to land
  // before the inserts that repopulate those keys.
  await db.batch([...clearStmts, ...totalStmts, ...countryStmts]);

  // The count the caller reports. A date can be fetched successfully and still
  // store nothing — every hostname in the response may be the apex, or belong
  // to a subdomain that opted out — and reporting the date as collected then
  // claims data that does not exist.
  return bySubdomain.size;
}
