# analytics

Platform visit totals. A cron-only Worker that reads aggregate traffic from
Cloudflare's GraphQL Analytics API and stores one row per subdomain per day in
D1, filling whatever days are missing on each run.

No `fetch` handler, no routes — it is never in anyone's request path.

## Why it pulls instead of counting

The obvious design is Workers Analytics Engine: call `writeDataPoint()` on each
request and query it back with SQL. It does not work here, and the reason is
worth keeping written down.

`writeDataPoint` is a Worker binding, so a Worker has to _execute_ for a request
to be recorded. Our Workers hold these routes:

| Worker            | Route                               |
| ----------------- | ----------------------------------- |
| `portfolio-proxy` | one per claimed portfolio           |
| `og`              | `*.is-pinoy.dev/_tools/og*`         |
| `site-audit`      | `*.is-pinoy.dev/_tools/site-audit*` |
| `status`          | `status.is-pinoy.dev/*`             |

A normal subdomain — CNAME'd to its owner's host with `proxied: true` — goes
edge → origin and executes nothing of ours. Analytics Engine would see none of
it, and that is most of the registry. Covering it would need a
`*.is-pinoy.dev/*` route, which `packages/registry/src/core/routes.ts` rejects
on purpose: it would put our Worker in front of ~40 sites we don't own.

The GraphQL API has no such problem, because Cloudflare measures proxied
traffic at its own edge whether we ask or not. That is the whole trade — we get
platform-wide coverage and a daily granularity ceiling, instead of per-event
data for a minority of subdomains.

A second reason not to switch: the opt-out below is enforced _before_ anything
is written. Per-request collection would have to consult the opt-out per
request, or store first and filter on read — and the second one silently breaks
a promise made in `apps/web/app/privacy`.

## What it stores

Two tables in the `analytics-db` D1 database (`worker/migrations/0001_init.sql`):

| Table                     | Key                          | Holds                           |
| ------------------------- | ---------------------------- | ------------------------------- |
| `visits_daily`            | `(subdomain, date)`          | that day's visit total          |
| `visits_daily_by_country` | `(subdomain, date, country)` | the same total split by country |

Both are written with `INSERT OR REPLACE`, so re-collecting a day is safe and a
retry is never a duplicate.

The source query groups on `clientRequestHTTPHost` and `clientCountryName` and
sums `visits`. It has **no path filter**, so `/_tools/*` requests on a
subdomain land in that subdomain's total — the privacy policy says so, and any
change here needs to keep saying so.

## Opt-out

`src/github.ts` lists `is-pinoy-dev/domains` and drops any subdomain whose
record sets `features.analytics: false` **before** the write.

A record that can't be read is never treated as consent, but it is not dropped
silently either — the whole run aborts. Dropping them individually meant a
rate-limited run stored the day for whichever handful of records happened to
answer, and since writes are keyed on the date and the backfill only looks at
the newest date present, that partial day then looked complete to every later
run. Aborting costs nothing: the writes are idempotent and the next run
re-collects the date.

The list is fetched once per invocation and reused for every date being
collected, so a backfill applies today's opt-outs to the days it fills rather
than resurrecting history for someone who has since switched off.

If GitHub returns an empty list the run aborts rather than treating "no
subdomains" as "delete nothing, write nothing" against a real outage.

## Backfill and gaps

The cron does not ask for "yesterday". It reads `MAX(date)` from `visits_daily`
and collects every day from there up to the last complete UTC day, bounded by
`MAX_BACKFILL_DAYS` (30).

That makes a missed run self-healing — the next successful invocation fills the
hole — and means an empty database backfills a month on first run instead of
launching with a single point. One day failing does not discard the days that
succeeded, and the run still ends in a throw so the failure is recorded.

How far back a first run actually reaches depends on the zone's analytics
retention, which is plan-dependent. Beyond it the API returns nothing and those
days stay empty.

## Secrets

Three GitHub **repository secrets** on `is-pinoy-dev/ecosystem`. The deploy
workflow pushes them onto the Worker after deploying, so rotating any is a
secret edit plus a workflow re-run — no local wrangler.

| Repository secret                   | Becomes        | Value                                                                                                 |
| ----------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| `CF_ECOSYSTEM_ANALYTICS_READ_TOKEN` | `CF_API_TOKEN` | Cloudflare API token, `Account Analytics: Read` + `Zone Analytics: Read`. No write scope of any kind. |
| `CF_ZONE_ID`                        | `CF_ZONE_ID`   | The is-pinoy.dev zone id.                                                                             |
| `CF_ECOSYSTEM_REGISTRY_READ_TOKEN`  | `GITHUB_TOKEN` | GitHub token with public read access, for the registry listing. Never writes.                         |

`CF_WORKER_DEPLOY_TOKEN` is separate and only authenticates `wrangler deploy`.

The third one is not optional in practice. GitHub rate limits unauthenticated
REST calls to 60/hr **per IP**, and a Worker's egress address is shared across
Cloudflare's pool — so the budget is usually already spent by someone else and
the listing comes back `403`. With a token the limit is 5,000/hr against our own
account, which one run a day nowhere near approaches.

The sync step skips whatever is absent, so the Worker deploys fine without any
of them — it just collects nothing. **That is the failure mode to watch for:**
the scheduled run throws, and nothing surfaces it except the Worker's logs.

## Is collection healthy?

One query answers it:

```bash
pnpm dlx wrangler d1 execute analytics-db --remote \
  --command "SELECT MAX(date) AS through, COUNT(*) AS rows FROM visits_daily"
```

| Result                      | Meaning                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------- |
| `through` = yesterday       | Healthy.                                                                           |
| `through` several days back | Runs are failing; the next success backfills up to 30 days. Check the Worker logs. |
| `through` NULL, 0 rows      | Nothing has ever been collected — almost always the secrets above.                 |

Observability is on (`wrangler.toml`), so failures appear in the Worker's logs
with the message naming which dates failed and why. Two worth recognising:

| Message                                | Cause                                                                                                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GitHub API error: 403`                | The registry listing is being rate limited. Set `CF_ECOSYSTEM_REGISTRY_READ_TOKEN` and re-run the deploy workflow.                                                                      |
| `Could not read N/M subdomain records` | Some record files did not answer. The run aborted on purpose rather than storing a day for only the subdomains that did — usually the same rate limiting, and it clears with the token. |

Worth adding a Cloudflare notification on Worker errors: a cron that throws is
otherwise completely silent.

## Who reads it

`apps/dashboard` (`lib/analytics.ts`), over the D1 HTTP API — the same route it
already uses for its registry read model, so no binding is involved. It reaches
this database rather than the dashboard's own, because the dashboard schema is
a read model that can be rebuilt from the domains repo and dropped on that
basis, while visit history cannot be reconstructed from anything.

The database id defaults to the one in `worker/wrangler.toml`; override it with
`CLOUDFLARE_ANALYTICS_D1_DATABASE_ID`. The dashboard's existing
`CLOUDFLARE_D1_API_TOKEN` needs read access to **this** database as well as its
own.

## Deploy

```bash
pnpm --filter analytics deploy
```

Runs on push to `main` under `.github/workflows/deploy-analytics.yml`.

## Tests

```bash
pnpm --filter analytics test
```
