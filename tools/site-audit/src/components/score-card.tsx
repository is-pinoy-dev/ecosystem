import type { AuditCategory } from "@is-pinoy-dev/schemas";

interface ScoreCardProps {
  label: string;
  category: AuditCategory;
}

type ScoreLevel = "pass" | "warn" | "fail";

const SCORE_STYLES: Record<ScoreLevel, { border: string; text: string; shadow: string }> = {
  pass: { border: "border-primary", text: "text-primary", shadow: "4px 4px 0px #D4A800" },
  warn: { border: "border-yellow-400", text: "text-yellow-400", shadow: "4px 4px 0px #000" },
  fail: { border: "border-destructive", text: "text-destructive", shadow: "4px 4px 0px #8B0000" },
};

function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) return "pass";
  if (score >= 50) return "warn";
  return "fail";
}

export function ScoreCard({ label, category }: ScoreCardProps) {
  const passed = category.fields.filter((f) => f.status === "pass").length;
  const total = category.fields.length;
  const level = getScoreLevel(category.score);
  const { border, text, shadow } = SCORE_STYLES[level];

  return (
    <div
      className={`bg-card border-2 p-6 flex flex-col gap-3 ${border}`}
      style={{ boxShadow: shadow }}
    >
      <p className="font-pixel text-[9px] text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      <p className={`font-pixel text-4xl ${text}`}>
        {category.score}
        <span className="text-lg">%</span>
      </p>
      <p className="font-pixel text-[8px] text-muted-foreground">
        {passed}/{total} CHECKS PASSED
      </p>
    </div>
  );
}
