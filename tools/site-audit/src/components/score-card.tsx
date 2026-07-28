import { useEffect, useState } from "react"
import type { AuditCategory } from "@is-pinoy-dev/schemas"

interface ScoreCardProps {
  label: string
  category: AuditCategory
  size?: "default" | "large"
}

type ScoreLevel = "pass" | "warn" | "fail"

const SCORE_STYLES: Record<ScoreLevel, { text: string; bar: string }> = {
  pass: { text: "text-success", bar: "bg-success" },
  warn: { text: "text-warning", bar: "bg-warning" },
  fail: { text: "text-destructive", bar: "bg-destructive" },
}

function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return "pass"
  if (score >= 50) return "warn"
  return "fail"
}

function useCountUp(target: number, duration = 700) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const start = performance.now()
    let frame = 0

    function tick(now: number) {
      const progress = target === 0 ? 1 : Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      setCount(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    // Driven entirely from the animation frame so the effect body never sets
    // state synchronously, and so a re-target cancels the in-flight loop.
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return count
}

function ProgressBar({ value, level }: { value: number; level: ScoreLevel }) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 50)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div
      className="h-1.5 w-full bg-muted"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full transition-all duration-700 ease-out ${SCORE_STYLES[level].bar}`}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export function ScoreCard({
  label,
  category,
  size = "default",
}: ScoreCardProps) {
  const passed = category.fields.filter((f) => f.status === "pass").length
  const total = category.fields.length
  const level = getScoreLevel(category.score)
  const { text } = SCORE_STYLES[level]
  const count = useCountUp(category.score)

  return (
    <div className="flex flex-col gap-4 border border-border bg-card p-5">
      <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={`m-0 font-semibold tracking-[-0.03em] ${text} ${
          size === "large" ? "text-5xl" : "text-4xl"
        }`}
      >
        {count}
        <span className={size === "large" ? "text-2xl" : "text-xl"}>%</span>
      </p>
      <ProgressBar value={category.score} level={level} />
      <p className="m-0 text-sm text-muted-foreground">
        {passed}/{total} checks passed
      </p>
    </div>
  )
}
