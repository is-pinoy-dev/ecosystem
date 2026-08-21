export interface RadarAxis {
  id: string
  label: string
  /** 0–100. */
  score: number
}

const MAX_RADIUS = 84
// Generous — labels like "Best Practices" or "Accessibility" extend well past
// their anchor point at this font size, and SVG clips anything outside the
// viewBox rather than wrapping it. Measured against the longest expected
// label so nothing gets cut off at the edges.
const PAD_X = 108
const PAD_TOP = 30
const PAD_BOTTOM = 44
const CENTER_X = PAD_X + MAX_RADIUS
const CENTER_Y = PAD_TOP + MAX_RADIUS
const WIDTH = PAD_X * 2 + MAX_RADIUS * 2
const HEIGHT = PAD_TOP + MAX_RADIUS * 2 + PAD_BOTTOM
const LABEL_RADIUS = 1.2
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

/** cos > 0 sits right of center, < 0 left — anchor the label so it never overlaps the axis. */
function anchorFor(index: number, count: number): "start" | "middle" | "end" {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2
  const cos = Math.cos(angle)
  if (cos > 0.3) return "start"
  if (cos < -0.3) return "end"
  return "middle"
}

/**
 * The category profile as a single labeled polygon. Only meaningful once every
 * axis has a real score — a partial radar (some axes at 0 because they simply
 * haven't been measured) would read as "this category scored zero," which is
 * false. Callers should render an empty state instead until all axes are known.
 */
export function RadarChart({ axes }: { axes: RadarAxis[] }) {
  const count = axes.length
  const dataPoints = axes.map((axis, i) =>
    pointAt(i, count, Math.max(0, Math.min(100, axis.score)) / 100)
  )
  const dataPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ")

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mx-auto w-full max-w-[420px]"
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
          r={4}
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
            y={label.y - 6}
            textAnchor={anchor}
            fill="var(--muted-foreground)"
            className="font-mono text-[10px] font-semibold tracking-[0.08em] uppercase"
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
            y={label.y + 10}
            textAnchor={anchor}
            fill="var(--foreground)"
            className="text-[13px] font-semibold"
          >
            {axis.score}
          </text>
        )
      })}
    </svg>
  )
}
