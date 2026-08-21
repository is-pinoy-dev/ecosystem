type ScoreLevel = "pass" | "warn" | "fail"

const SCORE_STYLES: Record<ScoreLevel, string> = {
  pass: "text-success",
  warn: "text-warning",
  fail: "text-destructive",
}

function getScoreLevel(score: number): ScoreLevel {
  if (score >= 90) return "pass"
  if (score >= 50) return "warn"
  return "fail"
}

export function PsiScoreCard({
  label,
  score,
}: {
  label: string
  score: number | null
}) {
  const level = score === null ? "warn" : getScoreLevel(score)

  return (
    <div className="flex flex-col gap-2 border border-border bg-card p-4 text-center">
      <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </p>
      <p
        className={`m-0 text-3xl font-semibold tracking-[-0.02em] ${SCORE_STYLES[level]}`}
      >
        {score ?? "—"}
      </p>
    </div>
  )
}
