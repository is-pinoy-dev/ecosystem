// Weekly rotation for the landing showcase. Kept free of `server-only` and of
// any clock of its own so the component passes the time in and tests can pin it.

const DAY_MS = 24 * 60 * 60 * 1000
const WEEK_MS = 7 * DAY_MS
// The Unix epoch fell on a Thursday, so shifting by four days puts the rotation
// boundary at Monday 00:00 UTC rather than mid-week.
const MONDAY_OFFSET_MS = 4 * DAY_MS

/** Whole weeks since the Monday on or after the Unix epoch. */
export function weekIndex(now: Date): number {
  return Math.floor((now.getTime() - MONDAY_OFFSET_MS) / WEEK_MS)
}

/**
 * The Monday 00:00 UTC that opens the week containing `now`.
 *
 * Callers use this to decide which entries are in play for the week. A window
 * that advances by index only means "this week's sites" while the list under it
 * holds still, so the pool has to be settled at the boundary rather than read
 * live.
 */
export function weekStart(now: Date): Date {
  return new Date(weekIndex(now) * WEEK_MS + MONDAY_OFFSET_MS)
}

/**
 * A window of `count` entries that advances by `count` each week and wraps at
 * the end, so consecutive weeks feature disjoint entries and every entry comes
 * round in turn. Derived from the calendar rather than from randomness: the
 * section must not reshuffle between two requests in the same week, or between
 * a server render and the visitor reloading the page.
 *
 * Pools no larger than the window are returned untouched — there is nothing to
 * rotate through, and dropping entries to fake movement would only hide sites.
 */
export function rotateWeekly<T>(entries: T[], count: number, now: Date): T[] {
  if (entries.length <= count) return entries

  const length = entries.length
  // Week indices before 1970 are negative, so normalize into range.
  const start = (((weekIndex(now) * count) % length) + length) % length
  return Array.from({ length: count }, (_, i) => entries[(start + i) % length]!)
}
