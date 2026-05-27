import { useOutletContext } from "react-router";
import { Button } from "@is-pinoy-dev/ui/components/button";
import type { AuditContext } from "./layout";
import { ScoreCard } from "../components/score-card";
import { IssueList } from "../components/issue-list";

export function meta() {
  return [
    { title: "Overview — Site Audit | is-pinoy.dev" },
    { name: "description", content: "SEO and OpenGraph audit overview" },
  ];
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <ScoreCard label="SEO Score" category={seo} />
        <ScoreCard label="Open Graph Score" category={og} />
      </div>
      <IssueList seo={seo} og={og} />
    </div>
  );
}
