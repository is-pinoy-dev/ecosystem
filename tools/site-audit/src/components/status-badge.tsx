import type { AuditField } from "@is-pinoy-dev/schemas"

const STATUS_STYLES: Record<AuditField["status"], string> = {
  pass: "bg-accent-green text-primary-foreground",
  warn: "bg-primary text-primary-foreground",
  fail: "bg-destructive text-white",
}

export function StatusBadge({ status }: { status: AuditField["status"] }) {
  return (
    <span
      className={`px-2 py-1 text-[11px] whitespace-nowrap shadow-[2px_2px_0_var(--color-foreground)] ${STATUS_STYLES[status]}`}
    >
      {status.toUpperCase()}
    </span>
  )
}
