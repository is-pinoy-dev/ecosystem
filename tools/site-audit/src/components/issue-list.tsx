import type { AuditCategory, AuditField } from "@is-pinoy-dev/schemas";

interface IssueListProps {
  seo: AuditCategory;
  og: AuditCategory;
}

function StatusBadge({ status }: { status: AuditField["status"] }) {
  const styles = {
    pass: "bg-primary text-primary-foreground",
    warn: "bg-yellow-400 text-black",
    fail: "bg-destructive text-white",
  };
  return (
    <span
      className={`font-pixel text-[7px] px-2 py-1 ${styles[status]}`}
      style={{ boxShadow: "2px 2px 0px #000" }}
    >
      {status.toUpperCase()}
    </span>
  );
}

export function IssueList({ seo, og }: IssueListProps) {
  const issues = [
    ...seo.fields.filter((f) => f.status !== "pass").map((f) => ({ ...f, category: "SEO" })),
    ...og.fields.filter((f) => f.status !== "pass").map((f) => ({ ...f, category: "OG" })),
  ];

  if (issues.length === 0) {
    return (
      <div
        className="bg-card border-2 border-primary p-6 text-center"
        style={{ boxShadow: "4px 4px 0px #D4A800" }}
      >
        <p className="font-pixel text-primary text-xs">ALL CHECKS PASSED</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-border" style={{ boxShadow: "4px 4px 0px #000" }}>
      <div className="border-b-2 border-border px-4 py-3">
        <p className="font-pixel text-[9px] text-foreground">
          ISSUES ({issues.length})
        </p>
      </div>
      <ul className="divide-y divide-border">
        {issues.map((issue, i) => (
          <li key={i} className="flex items-start gap-4 px-4 py-3">
            <StatusBadge status={issue.status} />
            <div className="flex-1 min-w-0">
              <p className="font-pixel text-[9px] text-foreground">
                <span className="text-muted-foreground">[{issue.category}]</span>{" "}
                {issue.label}
              </p>
              {issue.message && (
                <p className="font-pixel text-[8px] text-muted-foreground mt-1">
                  {issue.message}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
