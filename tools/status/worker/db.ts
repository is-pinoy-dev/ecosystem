import type { D1Database } from "@cloudflare/workers-types";
import type { OverallStatus, SubdomainCheck } from "./types";

export async function upsertStatus(
  db: D1Database,
  check: SubdomainCheck
): Promise<void> {
  const current = await db
    .prepare(
      "SELECT overall, since FROM subdomain_status WHERE subdomain = ?"
    )
    .bind(check.subdomain)
    .first<{ overall: OverallStatus; since: string }>();

  const since =
    !current || current.overall !== check.overall
      ? check.last_checked
      : current.since;

  await db
    .prepare(
      `INSERT INTO subdomain_status
         (subdomain, dns_status, http_status, overall, since, last_checked)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(subdomain) DO UPDATE SET
         dns_status   = excluded.dns_status,
         http_status  = excluded.http_status,
         overall      = excluded.overall,
         since        = excluded.since,
         last_checked = excluded.last_checked`
    )
    .bind(
      check.subdomain,
      check.dns_status,
      check.http_status,
      check.overall,
      since,
      check.last_checked
    )
    .run();
}
