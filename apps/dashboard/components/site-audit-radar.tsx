export interface SiteAuditRadarAxis {
  id: string
  label: string
  /** 0–100. */
  score: number
}

// Mirrors tools/site-audit/src/components/radar-chart.tsx so the same shape
// reads the same way in both places — kept separate rather than shared
// because the two are independently deployed apps.

const MAX_RADIUS = 64
const PAD_X = 84
const PAD_TOP = 24
const PAD_BOTTOM = 34
const CENTER_X = PAD_X + MAX_RADIUS
const CENTER_Y = PAD_TOP + MAX_RADIUS
const WIDTH = PAD_X * 2 + MAX_RADIUS * 2
const HEIGHT = PAD_TOP + MAX_RADIUS * 2 + PAD_BOTTOM
const LABEL_RADIUS = 1.22
const RINGS = [0.25, 0.5, 0.75, 1]

function pointAt(index: number, count: number, fraction: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2
  const radius = MAX_RADIUS * fraction
  return {
    x: CENTER_X + radius * Math.cos(angle),
    y: CENTER_Y + radius * Math.sin(angle),
  }
}

function ringPoints(count: number, fraction: number) {
  return Array.from({ length: count }, (_, i) => pointAt(i, count, fraction))
    .map((p) => `${p.x},${p.y}`)
    .join(" ")
}

function anchorFor(index: number, count: number): "start" | "middle" | "end" {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2
  const cos = Math.cos(angle)
  if (cos > 0.3) return "start"
  if (cos < -0.3) return "end"
  return "middle"
}

/** Read-only rendering of a site-audit category profile — see caller for the empty state. */
export function SiteAuditRadar({ axes }: { axes: SiteAuditRadarAxis[] }) {
  const count = axes.length
  const dataPoints = axes.map((axis, i) =>
    pointAt(i, count, Math.max(0, Math.min(100, axis.score)) / 100)
  )
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ")

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mx-auto w-full max-w-[320px]"
      role="img"
      aria-label={`Category radar — ${axes.map((a) => `${a.label} ${a.score}`).join(", ")}`}
    >
      {RINGS.map((fraction) => (
        <polygon
          key={fraction}
          points={ringPoints(count, fraction)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={1}
        />
      ))}
      {axes.map((axis, i) => {
        const outer = pointAt(i, count, 1)
        return (
          <line
            key={axis.id}
            x1={CENTER_X}
            y1={CENTER_Y}
            x2={outer.x}
            y2={outer.y}
            stroke="var(--border)"
            strokeWidth={1}
          />
        )
      })}
      <polygon
        points={dataPath}
        fill="var(--accent)"
        fillOpacity={0.12}
        stroke="var(--accent)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {dataPoints.map((p, i) => (
        <circle
          key={axes[i]!.id}
          cx={p.x}
          cy={p.y}
          r={3.5}
          fill="var(--accent)"
          stroke="var(--card)"
          strokeWidth={2}
        />
      ))}
      {axes.map((axis, i) => {
        const label = pointAt(i, count, LABEL_RADIUS)
        const anchor = anchorFor(i, count)
        return (
          <text
            key={`${axis.id}-label`}
            x={label.x}
            y={label.y - 5}
            textAnchor={anchor}
            fill="var(--muted-foreground)"
            className="font-mono text-[9px] font-semibold tracking-[0.08em] uppercase"
          >
            {axis.label}
          </text>
        )
      })}
      {axes.map((axis, i) => {
        const label = pointAt(i, count, LABEL_RADIUS)
        const anchor = anchorFor(i, count)
        return (
          <text
            key={`${axis.id}-score`}
            x={label.x}
            y={label.y + 9}
            textAnchor={anchor}
            fill="var(--foreground)"
            className="text-[12px] font-semibold"
          >
            {axis.score}
          </text>
        )
      })}
    </svg>
  )
}
