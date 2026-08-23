/**
 * A compact trend line for one subdomain's daily visits.
 *
 * Single series, so no legend and one ink colour — `currentColor`, set by the
 * caller via a text-color class, so it follows the same foreground convention
 * as the full Visits panel rather than the brand yellow (too low-contrast as
 * a thin mark). The fill is a vertical gradient from that colour down to
 * transparent, which is the "gradient line chart" look without inventing a
 * second hue.
 *
 * Decorative: the total next to it already states the number in text, so the
 * mark itself is hidden from assistive tech.
 */
interface Props {
  /** Unique per card — becomes the SVG gradient id, so cards on the same page don't collide. */
  id: string
  /** Oldest first. Needs at least two points to draw a line. */
  points: number[]
  className?: string
}

const WIDTH = 96
const HEIGHT = 32
const TOP_PAD = 2

export function VisitsSparkline({ id, points, className }: Props) {
  if (points.length < 2) return null

  const max = Math.max(...points, 1)
  const stepX = WIDTH / (points.length - 1)
  const coords = points.map((value, index) => {
    const x = index * stepX
    const y = HEIGHT - (value / max) * (HEIGHT - TOP_PAD)
    return `${x.toFixed(2)},${y.toFixed(2)}`
  })
  const linePath = `M${coords.join(" L")}`
  const areaPath = `${linePath} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`
  const gradientId = `visits-spark-${id}`

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
