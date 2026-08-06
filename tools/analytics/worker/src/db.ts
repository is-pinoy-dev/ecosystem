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
): Promise<void> {
  if (rows.length === 0) return;

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

  if (bySubdomain.size === 0) return;

  const totalStmts: D1PreparedStatement[] = [];
  const countryStmts: D1PreparedStatement[] = [];

  for (const [subdomain, subRows] of bySubdomain) {
    const total = subRows.reduce((sum, r) => sum + r.requests, 0);
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

  await db.batch([...totalStmts, ...countryStmts]);
}
