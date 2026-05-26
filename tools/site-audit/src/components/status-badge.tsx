import type { AuditField } from "@is-pinoy-dev/schemas";

const STATUS_STYLES: Record<AuditField["status"], string> = {
  pass: "bg-accent-green text-primary-foreground",
  warn: "bg-primary text-primary-foreground",
  fail: "bg-destructive text-white",
};

export function StatusBadge({ status }: { status: AuditField["status"] }) {
  return (
    <span
      className={`font-pixel text-[11px] px-2 py-1 whitespace-nowrap ${STATUS_STYLES[status]}`}
      style={{ boxShadow: "2px 2px 0 var(--color-foreground)" }}
    >
      {status.toUpperCase()}
    </span>
  );
}
