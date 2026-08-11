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
silently either — the whole run aborts. Dropping them individually meant any
partial read stored the day for whichever records happened to answer, and since
writes are keyed on the date and the backfill only looks at the newest date
present, that partial day then looked complete to every later run. Aborting
costs nothing: the writes are idempotent and the next run re-collects the date.

The registry read is a single GraphQL request that returns the directory and
every record body together. That matters for more than latency — see the
subrequest budget note on `MAX_BACKFILL_DAYS` in `index.ts`.

The list is fetched once per invocation and reused for every date being
collected, so a backfill applies today's opt-outs to the days it fills rather
than resurrecting history for someone who has since switched off.

If GitHub returns an empty list the run aborts rather than treating "no
subdomains" as "delete nothing, write nothing" against a real outage.

## Backfill and gaps

The cron does not ask for "yesterday". It reads `MAX(date)` from `visits_daily`
and collects every day from there up to the last complete UTC day, bounded by
`MAX_BACKFILL_DAYS`.

That makes a missed run self-healing — the next successful invocation fills the
hole. One day failing does not discard the days that succeeded, and the run
still ends in a throw so the failure is recorded.

**The real ceiling is the zone's retention, not that constant.** It currently
serves about **eight days** and refuses anything older:

```
zone "…" cannot request data older than 1w1d,
but your query requests data from 4w2d2h25m10s ago
```

So the history you can ever hold starts on the day collection begins — there is
no backfilling a month that predates it. `MAX_BACKFILL_DAYS` is set just above
the observed window (10) so a run neither misses a recoverable day nor spends
subrequests on days that are certainly gone.

Retention is plan-dependent and can change, so the constant is deliberately not
load-bearing: a day past the window is **skipped, not failed**. It is reported
as `N beyond zone retention` rather than counted among the failures, so a long
outage does not bury a real error in two dozen identical refusals.

## Secrets

Three GitHub **repository secrets** on `is-pinoy-dev/ecosystem`. The deploy
workflow pushes them onto the Worker after deploying, so rotating any is a
secret edit plus a workflow re-run — no local wrangler.

| Repository secret                   | Becomes        | Value                                                                                                                                |
| ----------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `CF_ECOSYSTEM_ANALYTICS_READ_TOKEN` | `CF_API_TOKEN` | Cloudflare API token with `Zone` → `Analytics` → `Read`, and the is-pinoy.dev zone under Zone Resources. No write scope of any kind. |
| `CF_ZONE_ID`                        | `CF_ZONE_ID`   | The is-pinoy.dev zone id.                                                                                                            |
| `CF_ECOSYSTEM_REGISTRY_READ_TOKEN`  | `GITHUB_TOKEN` | GitHub token with repository contents read on `is-pinoy-dev/domains`. Never writes.                                                  |

`CF_WORKER_DEPLOY_TOKEN` is separate and only authenticates `wrangler deploy`.

None of the three is optional. The registry read uses GitHub's GraphQL API,
which rejects unauthenticated callers outright rather than rate limiting them,
so the run aborts before collecting anything.

The sync step skips whatever is absent, so the Worker deploys fine without any
of them — it just collects nothing. **That is the failure mode to watch for:**
the scheduled run throws, and nothing surfaces it except the Worker's logs.

## Is collection healthy?

One query answers it:

```bash
pnpm dlx wrangler d1 execute analytics-db --remote \
  --command "SELECT MAX(date) AS through, COUNT(*) AS rows FROM visits_daily"
```

| Result                      | Meaning                                                                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `through` = yesterday       | Healthy.                                                                                                                                      |
| `through` several days back | Runs are failing. The next success recovers whatever the zone still retains — days past that window are gone for good. Check the Worker logs. |
| `through` NULL, 0 rows      | Nothing has ever been collected — almost always the secrets above.                                                                            |

Observability is on (`wrangler.toml`), so failures appear in the Worker's logs
with the message naming which dates failed and why. Ones worth recognising:

| Message                                                          | Cause                                                                                                                                                                                                                              |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `does not have permission ... zone.analytics.read for zone <id>` | `CF_API_TOKEN` lacks `Zone` → `Analytics` → `Read`, or does not list that zone under Zone Resources. The zone id in the message is the one it must cover.                                                                          |
| `GITHUB_TOKEN is not set`                                        | `CF_ECOSYSTEM_REGISTRY_READ_TOKEN` never reached the Worker. Check the deploy run's "Sync runtime secrets" step.                                                                                                                   |
| `GitHub GraphQL error: Bad credentials`                          | The registry token is invalid or expired.                                                                                                                                                                                          |
| `Too many subrequests by single Worker invocation`               | The run exceeded the free plan's 50 external subrequests. One run spends 1 on the registry plus 1 per date, so this means `MAX_BACKFILL_DAYS` was raised too far — see the note on it in `index.ts`.                               |
| `cannot request data older than 1w1d`                            | Not a failure. The zone no longer retains that day; it is skipped and reported as `N beyond zone retention`. Only alarming if the count keeps growing, which would mean collection has been down longer than the retention window. |
| `Could not read N/M subdomain records`                           | Some record blobs came back empty or unparseable. The run aborted on purpose rather than storing a day for only the records that were readable.                                                                                    |

Worth adding a Cloudflare notification on Worker errors: a cron that throws is
otherwise completely silent.

## Who reads it

Two apps, both over the D1 HTTP API and both read-only:

| Reader           | File               | Shows                                                                    |
| ---------------- | ------------------ | ------------------------------------------------------------------------ |
| `apps/dashboard` | `lib/analytics.ts` | The full picture — daily series and country split — to the owner, signed in. |
| `apps/web`       | `lib/visits.ts`    | One 30-day total per showcase card, publicly.                            |

The public one needs no opt-out check of its own, and that is deliberate: the
collector drops an opted-out subdomain before anything is written, so a row
existing is itself the record of consent. Any future reader that filters *after*
reading is one edit away from publishing a total for someone who switched
collection off — see `apps/web/app/privacy`, which now promises the same
opt-out covers the display.

`apps/dashboard` reads it over the D1 HTTP API — the same route it
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
