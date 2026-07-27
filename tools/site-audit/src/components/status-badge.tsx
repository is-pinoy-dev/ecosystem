import type { AuditField } from "@is-pinoy-dev/schemas"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"

// Colour is paired with a label so status never depends on colour alone.
const STATUS_CONFIG: Record<
  AuditField["status"],
  {
    label: string
    tone: "success" | "warning" | "destructive"
    className: string
  }
> = {
  pass: {
    label: "Pass",
    tone: "success",
    className: "border-success/40 text-success",
  },
  warn: {
    label: "Warn",
    tone: "warning",
    className: "border-warning/40 text-warning",
  },
  fail: {
    label: "Fail",
    tone: "destructive",
    className: "border-destructive/40 text-destructive",
  },
}

export function StatusBadge({ status }: { status: AuditField["status"] }) {
  const { label, tone, className } = STATUS_CONFIG[status]
  return (
    <Badge variant="outline" className={`gap-1.5 ${className}`}>
      <StatusIndicator tone={tone} className="size-1.5" />
      {label}
    </Badge>
  )
}
