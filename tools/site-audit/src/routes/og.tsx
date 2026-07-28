import { useOutletContext } from "react-router"
import type { AuditContext } from "./layout"
import { AuditTable } from "../components/audit-table"
import { OgPreviews } from "../components/og-previews"
import { ErrorState, ScanningState } from "../components/audit-states"

export function meta() {
  return [
    { title: "Open Graph — Site Audit | is-pinoy.dev" },
    { name: "description", content: "Open Graph audit details" },
  ]
}

export default function Og() {
  const { state, runAudit } = useOutletContext<AuditContext>()

  if (state.status === "loading") return <ScanningState />

  if (state.status === "error") {
    return <ErrorState message={state.message} onRetry={() => runAudit()} />
  }

  const { og } = state.data
  const passed = og.fields.filter((f) => f.status === "pass").length

  const getValue = (label: string) =>
    og.fields.find((f) => f.label === label)?.value ?? null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
          Open Graph
        </p>
        <h1 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          {passed}/{og.fields.length} checks passed
        </h1>
      </div>

      <AuditTable fields={og.fields} />

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
  )
}
