import { Sun } from "lucide-react"

const WEEKS = 24
const ROWS = 7
const WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""]
const MONTH_LABELS = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"]

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
// server-rendered and hydrated markup identical, and avoids drawing on any
// real contribution data that isn't available here.
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

const GRID: Tone[][] = (() => {
  const random = mulberry32(1337)
  return Array.from({ length: WEEKS }, () =>
    Array.from({ length: ROWS }, () => pickTone(random()))
  )
})()

const LEGEND_TONES: Tone[] = [
  "empty",
  "paleBlue",
  "medBlue",
  "strongBlue",
  "navy",
]

export function ContributionGrid() {
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
            className="flex min-w-max justify-between gap-[3px]"
            aria-hidden="true"
          >
            {GRID.map((week, wi) => (
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
            className="mt-1.5 flex min-w-max justify-between text-[10px] leading-none text-muted-foreground"
            aria-hidden="true"
          >
            {MONTH_LABELS.map((month) => (
              <span key={month}>{month}</span>
            ))}
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
