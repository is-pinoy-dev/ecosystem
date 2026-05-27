import type { AuditField } from "@is-pinoy-dev/schemas"

const STATUS_STYLES: Record<AuditField["status"], string> = {
  pass: "bg-accent-green text-primary-foreground",
  warn: "bg-primary text-primary-foreground",
  fail: "bg-destructive text-white",
}

export function StatusBadge({ status }: { status: AuditField["status"] }) {
  return (
    <span
      className={`px-2 py-1 text-[11px] whitespace-nowrap ${STATUS_STYLES[status]}`}
      style={{ boxShadow: "2px 2px 0 var(--color-foreground)" }}
    >
      {status.toUpperCase()}
    </span>
  )
}
