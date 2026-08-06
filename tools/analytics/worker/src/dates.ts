/**
 * Which days the cron still owes the database.
 *
 * The job used to collect exactly one day — yesterday — which meant a run that
 * failed for any reason left a permanent hole. Nothing retried it, and nothing
 * reported it, so the gap was only ever visible by querying the table. Deriving
 * the work from what is already stored makes a missed run self-healing: the
 * next successful invocation notices the hole and fills it.
 *
 * It also removes the need for a separate backfill entry point. On a database
 * with no rows yet, "everything missing up to yesterday" is the initial
 * backfill, so the feature launches with history rather than a single day.
 */

const DAY_MS = 86_400_000

/** `YYYY-MM-DD` in UTC. The GraphQL API's `Date` scalar wants exactly this. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseIsoDate(value: string): number {
  return Date.parse(`${value}T00:00:00Z`)
}

/**
 * The most recent day with complete data.
 *
 * Never today: Cloudflare is still accumulating the current UTC day, so
 * collecting it would store a partial count and — because the write is an
 * INSERT OR REPLACE keyed on the date — that partial would then look complete
 * to every later run.
 */
export function latestCompleteDate(now: Date): string {
  return isoDate(new Date(now.getTime() - DAY_MS))
}

/**
 * Days to collect, oldest first.
 *
 * `latestStored` is the newest date already in the table, or null when it is
 * empty. `maxDays` bounds both the initial backfill and the recovery from a
 * long outage — the zone's analytics retention is finite and plan-dependent, so
 * asking for dates beyond it costs a request per day and returns nothing.
 */
export function pendingDates(
  latestStored: string | null,
  now: Date,
  maxDays: number
): string[] {
  if (maxDays <= 0) return []

  const end = parseIsoDate(latestCompleteDate(now))
  const earliest = end - (maxDays - 1) * DAY_MS

  // A stored date at or past `end` means there is nothing to do. That includes
  // the future, which should not happen but must not produce a negative range.
  let start = earliest
  if (latestStored !== null) {
    const stored = parseIsoDate(latestStored)
    if (Number.isNaN(stored)) return []
    if (stored >= end) return []
    // Resume the day after what we have, but never reach further back than the
    // window allows — a table dormant for a year would otherwise ask for 365.
    start = Math.max(stored + DAY_MS, earliest)
  }

  const dates: string[] = []
  for (let t = start; t <= end; t += DAY_MS) {
    dates.push(isoDate(new Date(t)))
  }
  return dates
}
