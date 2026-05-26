import type { AuditCategory } from "@is-pinoy-dev/schemas"
import { StatusBadge } from "./status-badge"

interface IssueListProps {
  seo: AuditCategory
  og: AuditCategory
}

export function IssueList({ seo, og }: IssueListProps) {
  const issues = [
    ...seo.fields
      .filter((f) => f.status !== "pass")
      .map((f) => ({ ...f, category: "SEO" })),
    ...og.fields
      .filter((f) => f.status !== "pass")
      .map((f) => ({ ...f, category: "OG" })),
  ]

  if (issues.length === 0) {
    return (
      <div
        className="border-2 border-primary bg-card p-6 text-center"
        style={{ boxShadow: "4px 4px 0 var(--color-primary-dark)" }}
      >
        <p className="font-pixel text-xs text-primary">ALL CHECKS PASSED</p>
      </div>
    )
  }

  return (
    <div className="border-2 border-border bg-card shadow-[4px_4px_0_var(--color-muted)]">
      <div className="border-b-2 border-border px-4 py-3">
        <p className="font-pixel text-[11px] text-foreground">
          ISSUES ({issues.length})
        </p>
      </div>
      <ul className="divide-y divide-border">
        {issues.map((issue) => (
          <li
            key={`${issue.category}-${issue.label}`}
            className="flex items-start gap-4 px-4 py-3"
          >
            <StatusBadge status={issue.status} />
            <div className="min-w-0 flex-1">
              <p className="font-pixel text-[11px] text-foreground">
                <span className="text-muted-foreground">
                  [{issue.category}]
                </span>{" "}
                {issue.label}
              </p>
              {issue.message && (
                <p className="mt-1 font-pixel text-[11px] text-muted-foreground">
                  {issue.message}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
