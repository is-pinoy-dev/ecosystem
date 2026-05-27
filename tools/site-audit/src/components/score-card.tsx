/** biome-ignore-all lint/suspicious/noCommentText: <explanation> */
import { useEffect, useState } from "react"
import type { AuditCategory } from "@is-pinoy-dev/schemas"

interface ScoreCardProps {
  label: string
  category: AuditCategory
  size?: "default" | "large"
}

type ScoreLevel = "pass" | "warn" | "fail"

const SCORE_STYLES: Record<
  ScoreLevel,
  { border: string; text: string; shadow: string; bar: string }
> = {
  pass: {
    border: "border-green-400",
    text: "text-green-400",
    shadow: "4px 4px 0 var(--color-green-400)",
    bar: "bg-green-400",
  },
  warn: {
    border: "border-yellow-400",
    text: "text-yellow-400",
    shadow: "4px 4px 0 var(--color-primary)",
    bar: "bg-yellow-400",
  },
  fail: {
    border: "border-destructive",
    text: "text-destructive",
    shadow: "4px 4px 0 var(--color-destructive)",
    bar: "bg-destructive",
  },
}

function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return "pass"
  if (score >= 50) return "warn"
  return "fail"
}

function useCountUp(target: number, duration = 700) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setCount(0)
      return
    }
    const start = performance.now()

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) * (1 - progress)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)
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
    <div className="h-2 w-full border border-border bg-muted">
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
  const { border, text, shadow } = SCORE_STYLES[level]
  const count = useCountUp(category.score)

  return (
    <div
      className={`flex flex-col gap-3 border-2 bg-card p-6 ${border}`}
      style={{ boxShadow: shadow }}
    >
      <p className="font-pixel text-[11px] tracking-widest text-muted-foreground uppercase">
        // {label}
      </p>
      <p
        className={`font-pixel ${size === "large" ? "text-6xl" : "text-4xl"} ${text}`}
      >
        {count}
        <span className={size === "large" ? "text-2xl" : "text-lg"}>%</span>
      </p>
      <ProgressBar value={category.score} level={level} />
      <p className="text-[11px] text-muted-foreground">
        {passed}/{total} CHECKS PASSED
      </p>
    </div>
  )
}
