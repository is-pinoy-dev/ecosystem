import { Meter, type MeterLevel } from "./meter"
import { StatusBadge } from "./status-badge"

export interface CategoryScoreItem {
  id: string
  label: string
  /** null when this category hasn't been measured yet (PSI not run). */
  score: number | null
  level: MeterLevel | null
}

/**
 * Side-by-side magnitude comparison across categories — the radar's shape, read
 * as numbers. Warn and fail sit close together for CVD readers (validated via
 * dataviz's validate_palette.js), so every row also carries the StatusBadge
 * text label — color is reinforcement here, never the only signal.
 */
export function CategoryBarChart({ items }: { items: CategoryScoreItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="grid grid-cols-[minmax(96px,140px)_1fr_32px_auto] items-center gap-3"
        >
          <p className="m-0 truncate text-sm text-foreground">{item.label}</p>
          {item.score === null || item.level === null ? (
            <>
              <div className="h-2 w-full border border-dashed border-border" />
              <span className="text-right font-mono text-xs text-muted-foreground">
                —
              </span>
              <span className="text-xs text-muted-foreground">Not run</span>
            </>
          ) : (
            <>
              <Meter value={item.score} level={item.level} />
              <span className="text-right font-mono text-xs font-semibold text-foreground">
                {item.score}
              </span>
              <StatusBadge status={item.level} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
