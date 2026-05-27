/** biome-ignore-all lint/suspicious/noCommentText: <explanation> */
import { useOutletContext } from "react-router"
import { Button } from "@is-pinoy-dev/ui/components/button"
import type { AuditContext } from "./layout"
import { AuditTable } from "../components/audit-table"

export function meta() {
  return [
    { title: "Open Graph — Site Audit | is-pinoy.dev" },
    { name: "description", content: "Open Graph audit details" },
  ]
}

export default function Og() {
  const { state, runAudit } = useOutletContext<AuditContext>()

  if (state.status === "loading") {
    return (
      <p className="animate-pulse font-pixel text-xs text-primary">
        SCANNING...
      </p>
    )
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <p className="font-pixel text-xs text-destructive">
          ERROR: {state.message}
        </p>
        <Button onClick={() => runAudit()} variant="outline-shadow">
          RETRY
        </Button>
      </div>
    )
  }

  const { og } = state.data
  const passed = og.fields.filter((f) => f.status === "pass").length

  const getValue = (label: string) =>
    og.fields.find((f) => f.label === label)?.value ?? null

  const ogImage = getValue("og:image")
  const ogTitle = getValue("og:title")
  const ogDescription = getValue("og:description")
  const ogSiteName = getValue("og:site_name")

  return (
    <div className="space-y-4">
      <p className="font-pixel text-[11px] text-primary">
        // OPEN GRAPH — {passed}/{og.fields.length} PASSED
      </p>

      {ogImage && (
        <div className="space-y-2">
          <p className="font-pixel text-[11px] text-muted-foreground">// SOCIAL CARD PREVIEW</p>
          <div className="border-2 border-border bg-card shadow-[4px_4px_0_var(--color-muted)] max-w-sm">
            <img
              src={ogImage}
              alt="OG preview"
              className="w-full aspect-[1.91/1] object-cover border-b-2 border-border"
            />
            <div className="px-3 py-2 space-y-0.5">
              {ogSiteName && (
                <p className="font-pixel text-[9px] text-muted-foreground uppercase">{ogSiteName}</p>
              )}
              {ogTitle && (
                <p className="font-pixel text-[10px] text-foreground leading-relaxed">{ogTitle}</p>
              )}
              {ogDescription && (
                <p className="text-[11px] text-muted-foreground line-clamp-2">{ogDescription}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <AuditTable fields={og.fields} />
    </div>
  )
}
