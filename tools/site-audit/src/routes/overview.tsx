import { useOutletContext } from "react-router"
import type { AuditContext } from "./layout"
import { ScoreCard } from "../components/score-card"
import { IssueList } from "../components/issue-list"
import { ErrorState, ScanningState } from "../components/audit-states"
import type { AuditCategory } from "@is-pinoy-dev/schemas"

export function meta() {
  return [
    { title: "Overview — Site Audit | is-pinoy.dev" },
    { name: "description", content: "SEO and social audit overview" },
  ]
}

function buildOverallCategory(
  seo: AuditCategory,
  og: AuditCategory
): AuditCategory {
  return {
    score: Math.round((seo.score + og.score) / 2),
    fields: [...seo.fields, ...og.fields],
  }
}

export default function Overview() {
  const { state, runAudit } = useOutletContext<AuditContext>()

  if (state.status === "loading") return <ScanningState />

  if (state.status === "error") {
    return <ErrorState message={state.message} onRetry={() => runAudit()} />
  }

  const { seo, og } = state.data
  const overall = buildOverallCategory(seo, og)

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ScoreCard label="Overall score" category={overall} size="large" />
        <ScoreCard label="SEO" category={seo} />
        <ScoreCard label="Social" category={og} />
      </div>
      <IssueList seo={seo} og={og} limit={5} />
    </div>
  )
}
