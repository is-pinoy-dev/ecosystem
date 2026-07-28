import { CheckCircle2 } from "lucide-react"
import type { AuditCategory } from "@is-pinoy-dev/schemas"
import { StatusBadge } from "./status-badge"

interface IssueListProps {
  seo: AuditCategory
  og: AuditCategory
  limit?: number
}

const PRIORITY = { fail: 0, warn: 1, pass: 2 }

export function IssueList({ seo, og, limit }: IssueListProps) {
  const issues = [
    ...seo.fields
      .filter((f) => f.status !== "pass")
      .map((f) => ({ ...f, category: "SEO" })),
    ...og.fields
      .filter((f) => f.status !== "pass")
      .map((f) => ({ ...f, category: "Social" })),
  ].sort((a, b) => PRIORITY[a.status] - PRIORITY[b.status])

  if (issues.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2.5 border border-border bg-card p-6">
        <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
        <p className="m-0 text-sm font-medium text-foreground">
          All checks passed
        </p>
      </div>
    )
  }

  const shown = limit ? issues.slice(0, limit) : issues
  const extra = issues.length - shown.length

  return (
    <div className="border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          Issues ({issues.length})
        </p>
      </div>
      <ul className="m-0 list-none divide-y divide-border p-0">
        {shown.map((issue) => (
          <li
            key={`${issue.category}-${issue.label}`}
            className="flex items-start gap-4 px-4 py-3"
          >
            <StatusBadge status={issue.status} />
            <div className="min-w-0 flex-1">
              <p className="m-0 text-sm text-foreground">
                <span className="font-mono text-xs text-muted-foreground">
                  {issue.category}
                </span>{" "}
                {issue.label}
              </p>
              {issue.message && (
                <p className="m-0 mt-1 text-sm leading-6 text-muted-foreground">
                  {issue.message}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {extra > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="m-0 text-sm text-muted-foreground">
            +{extra} more issues — see the SEO → Issues tab.
          </p>
        </div>
      )}
    </div>
  )
}
