/** biome-ignore-all lint/suspicious/noCommentText: <explanation> */
import { useOutletContext } from "react-router"
import { Button } from "@is-pinoy-dev/ui/components/button"
import type { AuditContext } from "./layout"
import { AuditTable } from "../components/audit-table"
import { OgPreviews } from "../components/og-previews"

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

  return (
    <div className="space-y-4">
      <p className="font-pixel text-[11px] text-primary">
        // OPEN GRAPH — {passed}/{og.fields.length} PASSED
      </p>

      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0">
          <AuditTable fields={og.fields} />
        </div>
        <div className="w-72 shrink-0">
          <OgPreviews
            ogImage={getValue("og:image")}
            ogTitle={getValue("og:title")}
            ogDescription={getValue("og:description")}
            ogSiteName={getValue("og:site_name")}
            ogUrl={getValue("og:url")}
            twitterCard={getValue("twitter:card")}
            twitterImage={getValue("twitter:image")}
            twitterTitle={getValue("twitter:title")}
            twitterDescription={getValue("twitter:description")}
            twitterSite={getValue("twitter:site")}
          />
        </div>
      </div>
    </div>
  )
}
