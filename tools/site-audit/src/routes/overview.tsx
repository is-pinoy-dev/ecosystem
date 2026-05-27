import { useOutletContext } from "react-router";
import { Button } from "@is-pinoy-dev/ui/components/button";
import type { AuditContext } from "./layout";
import { ScoreCard } from "../components/score-card";
import { IssueList } from "../components/issue-list";
import type { AuditCategory } from "@is-pinoy-dev/schemas";

export function meta() {
  return [
    { title: "Overview — Site Audit | is-pinoy.dev" },
    { name: "description", content: "SEO and OpenGraph audit overview" },
  ];
}

function buildOverallCategory(seo: AuditCategory, og: AuditCategory): AuditCategory {
  return {
    score: Math.round((seo.score + og.score) / 2),
    fields: [...seo.fields, ...og.fields],
  }
}

export default function Overview() {
  const { state, runAudit } = useOutletContext<AuditContext>();

  if (state.status === "loading") {
    return (
      <p className="font-pixel text-primary text-xs animate-pulse">
        SCANNING...
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div className="space-y-4">
        <p className="font-pixel text-destructive text-xs">
          ERROR: {state.message}
        </p>
        <Button onClick={() => runAudit()} variant="outline-shadow">
          RETRY
        </Button>
      </div>
    );
  }

  const { seo, og } = state.data;
  const overall = buildOverallCategory(seo, og);

  return (
    <div className="space-y-4">
      <ScoreCard label="Overall Score" category={overall} size="large" />
      <div className="grid grid-cols-2 gap-4">
        <ScoreCard label="SEO Score" category={seo} />
        <ScoreCard label="Open Graph Score" category={og} />
      </div>
      <IssueList seo={seo} og={og} />
    </div>
  );
}
