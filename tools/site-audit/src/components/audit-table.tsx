import type { AuditField } from "@is-pinoy-dev/schemas"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@is-pinoy-dev/ui/components/accordion"
import { GUIDELINES } from "../lib/guidelines"
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
      <Accordion type="multiple" className="divide-y divide-border">
        {fields.map((field) => (
          <AccordionItem key={field.label} value={field.label} className="border-b-0">
            <AccordionTrigger className="px-4 py-3 items-center hover:no-underline hover:bg-muted/30 [&>svg]:ml-4 [&>svg]:shrink-0">
              <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-4 w-full">
                <p className="text-[11px] text-foreground text-left">{field.label}</p>
                <p className="font-mono text-[11px] break-all text-muted-foreground text-left">
                  {field.value ? (
                    truncate(field.value)
                  ) : (
                    <span className="text-destructive">Not found</span>
                  )}
                </p>
                <StatusBadge status={field.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <div className="flex flex-col gap-2 pt-1 border-t border-border/50 mt-1">
                {field.value && (
                  <div>
                    <span className="font-pixel text-[9px] text-muted-foreground uppercase tracking-wider">Full value</span>
                    <p className="font-mono text-[11px] text-foreground break-all mt-1">{field.value}</p>
                  </div>
                )}
                {field.message && (
                  <div>
                    <span className="font-pixel text-[9px] text-muted-foreground uppercase tracking-wider">Issue</span>
                    <p className="text-[11px] text-destructive mt-1">{field.message}</p>
                  </div>
                )}
                {GUIDELINES[field.label] && (
                  <>
                    <div>
                      <span className="font-pixel text-[9px] text-muted-foreground uppercase tracking-wider">Guideline</span>
                      <p className="text-[11px] text-foreground mt-1">{GUIDELINES[field.label].guideline}</p>
                    </div>
                    <div>
                      <span className="font-pixel text-[9px] text-muted-foreground uppercase tracking-wider">SEO Impact</span>
                      <p className="text-[11px] text-muted-foreground mt-1">{GUIDELINES[field.label].impact}</p>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
