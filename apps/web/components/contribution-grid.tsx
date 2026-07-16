import { Sun } from "lucide-react"

const WEEKS = 24
const ROWS = 7
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""]

const PALETTE = {
  empty: "var(--contrib-empty)",
  paleBlue: "var(--contrib-pale-blue)",
  medBlue: "var(--contrib-med-blue)",
  strongBlue: "var(--contrib-strong-blue)",
  navy: "var(--contrib-navy)",
  paleYellow: "var(--contrib-pale-yellow)",
  yellow: "var(--contrib-yellow)",
} as const

type Tone = keyof typeof PALETTE

const LEGEND_TONES: Tone[] = [
  "empty",
  "paleBlue",
  "medBlue",
  "strongBlue",
  "navy",
]

// ─── Illustrative fallback (used while loading or if the API is unavailable) ──

const TONE_WEIGHTS: [Tone, number][] = [
  ["empty", 55],
  ["paleBlue", 16],
  ["medBlue", 11],
  ["strongBlue", 7],
  ["navy", 4],
  ["paleYellow", 4],
  ["yellow", 3],
]

function pickTone(rand: number): Tone {
  let cursor = rand * 100
  for (const [tone, weight] of TONE_WEIGHTS) {
    if (cursor < weight) return tone
    cursor -= weight
  }
  return "empty"
}

// Deterministic pseudo-random generator (mulberry32) — a fixed seed keeps the
// server-rendered and hydrated markup identical for the fallback pattern.
function mulberry32(seed: number) {
  let state = seed
  return function random() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FALLBACK_TONES: Tone[][] = (() => {
  const random = mulberry32(1337)
  return Array.from({ length: WEEKS }, () =>
    Array.from({ length: ROWS }, () => pickTone(random()))
  )
})()

// ─── Real data — merged PRs across the org, bucketed into the grid ───────────

function startOfWeekMondayUTC(date: Date): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  )
  const day = d.getUTCDay()
  const diffToMonday = (day + 6) % 7
  d.setUTCDate(d.getUTCDate() - diffToMonday)
  return d
}

function gridStartDate(): Date {
  const currentWeekStart = startOfWeekMondayUTC(new Date())
  const start = new Date(currentWeekStart)
  start.setUTCDate(start.getUTCDate() - (WEEKS - 1) * 7)
  return start
}

// Returns one entry per week column — null unless that week is the first one
// to fall in a new month, so labels land on the correct column and each
// month appears at most once (fixed 4-week sampling could repeat or drift
// depending on how many days are in each month).
function monthLabelsFor(gridStart: Date): (string | null)[] {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  })
  let lastMonth = -1
  return Array.from({ length: WEEKS }, (_, week) => {
    const d = new Date(gridStart)
    d.setUTCDate(d.getUTCDate() + week * 7)
    const month = d.getUTCMonth()
    if (month === lastMonth) return null
    lastMonth = month
    return formatter.format(d)
  })
}

async function fetchMergedPrCounts(
  gridStart: Date
): Promise<number[][] | null> {
  const since = gridStart.toISOString().slice(0, 10)
  const counts: number[][] = Array.from({ length: WEEKS }, () =>
    Array(ROWS).fill(0)
  )

  try {
    let url: string | null =
      "https://api.github.com/search/issues?" +
      new URLSearchParams({
        q: `org:is-pinoy-dev is:pr is:merged merged:>=${since}`,
        per_page: "100",
        sort: "created",
        order: "asc",
      }).toString()

    let fetchedAny = false
    let pages = 0

    while (url && pages < 5) {
      const res: Response = await fetch(url, {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
      })
      if (!res.ok) break
      fetchedAny = true
      pages += 1

      const data = (await res.json()) as {
        items: { closed_at: string | null }[]
      }

      for (const item of data.items) {
        if (!item.closed_at) continue
        const closed = new Date(item.closed_at)
        const closedUTC = Date.UTC(
          closed.getUTCFullYear(),
          closed.getUTCMonth(),
          closed.getUTCDate()
        )
        const diffDays = Math.round(
          (closedUTC - gridStart.getTime()) / 86_400_000
        )
        if (diffDays < 0 || diffDays >= WEEKS * ROWS) continue
        counts[Math.floor(diffDays / ROWS)]![diffDays % ROWS]! += 1
      }

      const linkHeader = res.headers.get("link")
      const nextMatch = linkHeader?.match(/<([^>]+)>;\s*rel="next"/)
      url = nextMatch?.[1] ?? null
    }

    return fetchedAny ? counts : null
  } catch {
    return null
  }
}

function countsToTones(counts: number[][]): Tone[][] {
  let max = 0
  for (const week of counts) {
    for (const count of week) if (count > max) max = count
  }
  if (max === 0) return FALLBACK_TONES

  let yellowAssigned = false
  return counts.map((week) =>
    week.map((count): Tone => {
      if (count === 0) return "empty"
      if (max > 1 && count === max && !yellowAssigned) {
        yellowAssigned = true
        return "yellow"
      }
      if (count === 1) return "paleBlue"
      if (count === 2) return "medBlue"
      if (count === 3) return "strongBlue"
      return "navy"
    })
  )
}

// ─── Presentation ──────────────────────────────────────────────────────────

function ContributionGridView({
  tones,
  monthLabels,
}: {
  tones: Tone[][]
  monthLabels: (string | null)[]
}) {
  const gridTemplateColumns = `repeat(${WEEKS}, 10px)`

  return (
    <div>
      <div className="flex gap-2">
        <div
          className="flex shrink-0 flex-col gap-[3px] text-[10px] leading-none text-muted-foreground"
          aria-hidden="true"
        >
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i} className="flex h-[10px] items-center">
              {label}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto pb-1">
          <div
            className="grid min-w-max gap-[3px]"
            style={{ gridTemplateColumns }}
            aria-hidden="true"
          >
            {tones.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((tone, ri) => (
                  <span
                    key={ri}
                    className="size-[10px] shrink-0"
                    style={{ backgroundColor: PALETTE[tone] }}
                  />
                ))}
              </div>
            ))}
          </div>
          <div
            className="mt-1.5 grid min-w-max gap-[3px] text-[10px] leading-none text-muted-foreground"
            style={{ gridTemplateColumns }}
            aria-hidden="true"
          >
            {monthLabels.map((month, i) =>
              month ? (
                <span key={i} style={{ gridColumnStart: i + 1 }}>
                  {month}
                </span>
              ) : null
            )}
          </div>
        </div>
      </div>

      <p className="sr-only">
        A visualization of community contribution activity over the past six
        months, shown as a grid of weekly columns and daily rows.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
          aria-hidden="true"
        >
          <span>Less</span>
          {LEGEND_TONES.map((tone) => (
            <span
              key={tone}
              className="size-[10px]"
              style={{ backgroundColor: PALETTE[tone] }}
            />
          ))}
          <span>More</span>
        </div>
        <p className="m-0 flex items-center gap-2 text-[11px] text-muted-foreground">
          Every contribution weaves the grid.
          <Sun className="size-3 text-primary" aria-hidden="true" />
        </p>
      </div>
    </div>
  )
}

export function ContributionGridSkeleton() {
  return (
    <ContributionGridView
      tones={FALLBACK_TONES}
      monthLabels={monthLabelsFor(gridStartDate())}
    />
  )
}

export async function ContributionGrid() {
  const gridStart = gridStartDate()
  const counts = await fetchMergedPrCounts(gridStart)
  const tones = counts ? countsToTones(counts) : FALLBACK_TONES

  return (
    <ContributionGridView
      tones={tones}
      monthLabels={monthLabelsFor(gridStart)}
    />
  )
}
