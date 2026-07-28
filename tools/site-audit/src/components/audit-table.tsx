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

function DetailBlock({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <span className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      <div className="mt-1 text-sm leading-6">{children}</div>
    </div>
  )
}

export function AuditTable({ fields }: AuditTableProps) {
  return (
    <div className="border border-border bg-card">
      <div className="grid grid-cols-[1fr_2fr_auto] gap-4 border-b border-border px-4 py-2.5">
        <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Field
        </p>
        <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Value
        </p>
        <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Status
        </p>
      </div>
      <Accordion type="multiple" className="divide-y divide-border">
        {fields.map((field) => (
          <AccordionItem
            key={field.label}
            value={field.label}
            className="border-b-0"
          >
            <AccordionTrigger className="items-center px-4 py-3 hover:bg-muted/40 hover:no-underline [&>svg]:!ml-4 [&>svg]:shrink-0">
              <div className="grid w-full grid-cols-[1fr_2fr_auto] items-center gap-4">
                <p className="m-0 text-left text-sm text-foreground">
                  {field.label}
                </p>
                <p className="m-0 text-left font-mono text-[13px] break-all text-muted-foreground">
                  {field.value ? (
                    truncate(field.value)
                  ) : (
                    <span className="text-destructive">Not found</span>
                  )}
                </p>
                <StatusBadge status={field.status} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="flex flex-col gap-4 border-t border-border pt-4">
                {field.value && (
                  <DetailBlock label="Full value">
                    <p className="m-0 font-mono text-[13px] break-all text-foreground">
                      {field.value}
                    </p>
                  </DetailBlock>
                )}
                {field.message && (
                  <DetailBlock label="Issue">
                    <p className="m-0 text-destructive">{field.message}</p>
                  </DetailBlock>
                )}
                {GUIDELINES[field.label] && (
                  <>
                    <DetailBlock label="Guideline">
                      <p className="m-0 text-foreground">
                        {GUIDELINES[field.label].guideline}
                      </p>
                    </DetailBlock>
                    <DetailBlock label="SEO impact">
                      <p className="m-0 text-muted-foreground">
                        {GUIDELINES[field.label].impact}
                      </p>
                    </DetailBlock>
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
