import type { AuditField } from "@is-pinoy-dev/schemas"
import { StatusBadge } from "./status-badge"

interface AuditTableProps {
  fields: AuditField[]
}

function truncate(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max)}…` : value
}

export function AuditTable({ fields }: AuditTableProps) {
  return (
    <div className="border-2 border-border bg-card shadow-[4px_4px_0_var(--color-muted)]">
      <div className="grid grid-cols-[1fr_2fr_auto] gap-4 border-b-2 border-border px-4 py-2">
        <p className="font-pixel text-[11px] text-muted-foreground">FIELD</p>
        <p className="font-pixel text-[11px] text-muted-foreground">VALUE</p>
        <p className="font-pixel text-[11px] text-muted-foreground">STATUS</p>
      </div>
      <ul className="divide-y divide-border">
        {fields.map((field) => (
          <li
            key={field.label}
            className="grid grid-cols-[1fr_2fr_auto] items-center gap-4 px-4 py-3"
          >
            <p className="font-pixel text-[11px] text-foreground">
              {field.label}
            </p>
            <p className="font-pixel text-[11px] break-all text-muted-foreground">
              {field.value ? (
                truncate(field.value)
              ) : (
                <span className="text-destructive">Not found</span>
              )}
            </p>
            <StatusBadge status={field.status} />
          </li>
        ))}
      </ul>
    </div>
  )
}
