export type MeterLevel = "pass" | "warn" | "fail"

const METER_FILL: Record<MeterLevel, string> = {
  pass: "bg-success",
  warn: "bg-warning",
  fail: "bg-destructive",
}

/** A single value against its 0–100 ceiling — the fill carries severity, the track stays neutral. */
export function Meter({
  value,
  level,
  height = "h-2",
}: {
  value: number
  level: MeterLevel
  height?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={`${height} w-full bg-muted`}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full ${METER_FILL[level]} transition-all duration-700 ease-out`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
