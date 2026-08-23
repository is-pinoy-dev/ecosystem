import { ArrowUpRight } from "lucide-react"

import type { SiteAuditSummary } from "@/lib/site-audit"
import { SiteAuditRadar, type SiteAuditRadarAxis } from "@/components/site-audit-radar"

const PSI_LABELS: Record<string, string> = {
  performance: "Performance",
  accessibility: "Accessibility",
  "best-practices": "Best Practices",
}

type ScoreLevel = "pass" | "warn" | "fail"

const LEVEL_STYLES: Record<ScoreLevel, string> = {
  pass: "text-success",
  warn: "text-warning",
  fail: "text-destructive",
}

/** Matches the site-audit tool's own thresholds for the SEO/Social categories. */
function auditLevel(score: number): ScoreLevel {
  if (score >= 80) return "pass"
  if (score >= 50) return "warn"
  return "fail"
}

/** Matches Lighthouse's own 0.9 / 0.5 thresholds for the PSI-derived categories. */
function psiLevel(score: number): ScoreLevel {
  if (score >= 90) return "pass"
  if (score >= 50) return "warn"
  return "fail"
}

interface ScoreItem {
  id: string
  label: string
  score: number | null
  level: ScoreLevel | null
}

function buildScoreItems(summary: SiteAuditSummary): ScoreItem[] {
  const items: ScoreItem[] = [
    { id: "seo", label: "SEO", score: summary.seo.score, level: auditLevel(summary.seo.score) },
    { id: "og", label: "Social", score: summary.og.score, level: auditLevel(summary.og.score) },
  ]
  for (const category of summary.psi?.categories ?? []) {
    if (!(category.id in PSI_LABELS)) continue
    items.push({
      id: category.id,
      label: PSI_LABELS[category.id] ?? category.title,
      score: category.score,
      level: category.score != null ? psiLevel(category.score) : null,
    })
  }
  return items
}

export function SiteAuditPanel({
  subdomain,
  audit,
}: {
  subdomain: string
  audit: SiteAuditSummary | null
}) {
  const reportUrl = `https://${subdomain}.is-pinoy.dev/_tools/site-audit`

  if (!audit) {
    return (
      <div className="flex flex-col gap-2 border border-border bg-card p-4">
        <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Site audit
        </p>
        <p className="m-0 text-[13px] text-muted-foreground">
          No scan yet. Run one from the site audit tool and its scores will
          show up here.
        </p>
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 text-[13px] font-medium text-accent no-underline hover:underline"
        >
          Open site audit
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    )
  }

  const items = buildScoreItems(audit)
  const radarAxes: SiteAuditRadarAxis[] | null = audit.psi
    ? items
        .filter((item) => item.score !== null)
        .map((item) => ({ id: item.id, label: item.label, score: item.score! }))
    : null

  return (
    <div className="flex flex-col gap-4 border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Site audit
        </p>
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-accent no-underline hover:underline"
        >
          Full report
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        {radarAxes ? (
          <SiteAuditRadar axes={radarAxes} />
        ) : (
          <p className="m-0 text-[13px] text-muted-foreground">
            SEO and Social are two axes of five — run a PageSpeed check from
            the full report to add Performance, Accessibility and Best
            Practices.
          </p>
        )}

        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 border-t border-border py-1.5 first:border-t-0 first:pt-0"
            >
              <span className="font-mono text-xs text-muted-foreground uppercase">
                {item.label}
              </span>
              <span
                className={`text-sm font-semibold ${item.level ? LEVEL_STYLES[item.level] : "text-muted-foreground"}`}
              >
                {item.score ?? "—"}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="m-0 font-mono text-[11px] text-muted-foreground">
        Last audited {audit.auditedAt.slice(0, 10)} · {audit.url}
      </p>
    </div>
  )
}
