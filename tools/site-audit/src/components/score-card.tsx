import type { AuditCategory } from "@is-pinoy-dev/schemas";

interface ScoreCardProps {
  label: string;
  category: AuditCategory;
}

function scoreColor(score: number): string {
  if (score >= 80) return "border-primary text-primary";
  if (score >= 50) return "border-yellow-400 text-yellow-400";
  return "border-destructive text-destructive";
}

function scoreShadow(score: number): string {
  if (score >= 80) return "4px 4px 0px #D4A800";
  if (score >= 50) return "4px 4px 0px #000";
  return "4px 4px 0px #8B0000";
}

export function ScoreCard({ label, category }: ScoreCardProps) {
  const passed = category.fields.filter((f) => f.status === "pass").length;
  const total = category.fields.length;
  const colorClass = scoreColor(category.score);
  const shadow = scoreShadow(category.score);

  return (
    <div
      className={`bg-card border-2 p-6 flex flex-col gap-3 ${colorClass}`}
      style={{ boxShadow: shadow }}
    >
      <p className="font-pixel text-[9px] text-muted-foreground uppercase tracking-widest">
        {label}
      </p>
      <p className={`font-pixel text-4xl ${colorClass.split(" ")[1]}`}>
        {category.score}
        <span className="text-lg">%</span>
      </p>
      <p className="font-pixel text-[8px] text-muted-foreground">
        {passed}/{total} CHECKS PASSED
      </p>
    </div>
  );
}
