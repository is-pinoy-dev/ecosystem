import type { AuditCategory } from "@is-pinoy-dev/schemas"

interface ScoreCardProps {
  label: string
  category: AuditCategory
}

type ScoreLevel = "pass" | "warn" | "fail"

const SCORE_STYLES: Record<
  ScoreLevel,
  { border: string; text: string; shadow: string }
> = {
  pass: {
    border: "border-green-400",
    text: "text-green-400",
    shadow: "4px 4px 0 var(--color-green-400)",
  },
  warn: {
    border: "border-yellow-400",
    text: "text-yellow-400",
    shadow: "4px 4px 0 var(--color-primary)",
  },
  fail: {
    border: "border-destructive",
    text: "text-destructive",
    shadow: "4px 4px 0 var(--color-destructive)",
  },
}

function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return "pass"
  if (score >= 50) return "warn"
  return "fail"
}

export function ScoreCard({ label, category }: ScoreCardProps) {
  const passed = category.fields.filter((f) => f.status === "pass").length
  const total = category.fields.length
  const level = getScoreLevel(category.score)
  const { border, text, shadow } = SCORE_STYLES[level]

  return (
    <div
      className={`flex flex-col gap-3 border-2 bg-card p-6 ${border}`}
      style={{ boxShadow: shadow }}
    >
      <p className="font-pixel text-[11px] tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className={`font-pixel text-4xl ${text}`}>
        {category.score}
        <span className="text-lg">%</span>
      </p>
      <p className="font-pixel text-[11px] text-muted-foreground">
        {passed}/{total} CHECKS PASSED
      </p>
    </div>
  )
}
