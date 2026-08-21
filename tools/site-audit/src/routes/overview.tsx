import { Link, useOutletContext } from "react-router"
import type { AuditContext } from "./layout"
import { ScoreCard } from "../components/score-card"
import { IssueList } from "../components/issue-list"
import { ErrorState, ScanningState } from "../components/audit-states"
import { RadarChart, type RadarAxis } from "../components/radar-chart"
import {
  CategoryBarChart,
  type CategoryScoreItem,
} from "../components/category-bar-chart"
import type { MeterLevel } from "../components/meter"
import type { AuditCategory, PsiResult } from "@is-pinoy-dev/schemas"

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

/** Matches ScoreCard's own thresholds — these are the site-audit-computed categories. */
function auditLevel(score: number): MeterLevel {
  if (score >= 80) return "pass"
  if (score >= 50) return "warn"
  return "fail"
}

/** Matches Lighthouse's own 0.9 / 0.5 thresholds — these are PSI-computed categories. */
function psiLevel(score: number): MeterLevel {
  if (score >= 90) return "pass"
  if (score >= 50) return "warn"
  return "fail"
}

function buildCategoryItems(
  seo: AuditCategory,
  og: AuditCategory,
  psi: PsiResult | null
): CategoryScoreItem[] {
  const measured: CategoryScoreItem[] = [
    { id: "seo", label: "SEO", score: seo.score, level: auditLevel(seo.score) },
    { id: "og", label: "Social", score: og.score, level: auditLevel(og.score) },
  ]
  const psiCategories = psi?.categories ?? []
  const PSI_LABELS = {
    performance: "Performance",
    accessibility: "Accessibility",
    "best-practices": "Best Practices",
  } as const
  for (const id of Object.keys(PSI_LABELS) as (keyof typeof PSI_LABELS)[]) {
    const category = psiCategories.find((c) => c.id === id)
    measured.push({
      id,
      label: category?.title ?? PSI_LABELS[id],
      score: category?.score ?? null,
      level: category?.score != null ? psiLevel(category.score) : null,
    })
  }
  return measured
}

export default function Overview() {
  const { state, runAudit, psiState } = useOutletContext<AuditContext>()

  if (state.status === "loading") return <ScanningState />

  if (state.status === "error") {
    return <ErrorState message={state.message} onRetry={() => runAudit()} />
  }

  const { seo, og } = state.data
  const overall = buildOverallCategory(seo, og)
  const psi = psiState.status === "result" ? psiState.data : null
  const categoryItems = buildCategoryItems(seo, og, psi)

  const radarAxes: RadarAxis[] | null = psi
    ? categoryItems
        .filter((item) => item.score !== null)
        .map((item) => ({ id: item.id, label: item.label, score: item.score! }))
    : null

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ScoreCard label="Overall score" category={overall} size="large" />
        <ScoreCard label="SEO" category={seo} />
        <ScoreCard label="Social" category={og} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3 border border-border bg-card p-5">
          <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Category radar
          </p>
          {radarAxes ? (
            <RadarChart axes={radarAxes} />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
              <p className="m-0 text-sm text-muted-foreground">
                SEO and Social are two axes of five. Run a PageSpeed check to
                add Performance, Accessibility and Best Practices and complete
                the profile.
              </p>
              <Link
                to="/performance"
                className="text-sm font-medium text-accent no-underline hover:underline"
              >
                Go to Performance →
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border border-border bg-card p-5">
          <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            Category scores
          </p>
          <CategoryBarChart items={categoryItems} />
        </div>
      </div>

      <IssueList seo={seo} og={og} limit={5} />
    </div>
  )
}
