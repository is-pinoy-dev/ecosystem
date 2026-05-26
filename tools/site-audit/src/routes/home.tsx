import { useState, useEffect } from "react";
import type { AuditResult } from "@is-pinoy-dev/schemas";
import type { Tab } from "../lib/types";
import { parseAudit } from "../lib/parse-audit";
import { NavBar } from "../components/nav-bar";
import { ScoreCard } from "../components/score-card";
import { IssueList } from "../components/issue-list";
import { AuditTable } from "../components/audit-table";

type State =
  | { status: "loading" }
  | { status: "result"; data: AuditResult }
  | { status: "error"; message: string };

export function meta() {
  return [
    { title: "Site Audit — is-pinoy.dev" },
    { name: "description", content: "SEO and OpenGraph audit tool" },
  ];
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("overview");
  const [state, setState] = useState<State>({ status: "loading" });

  async function runAudit() {
    setState({ status: "loading" });
    const target = `https://${window.location.hostname}`;
    try {
      const res = await fetch(
        `/audit-proxy?url=${encodeURIComponent(target)}`
      );
      if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
      const html = await res.text();
      setState({ status: "result", data: parseAudit(html, target) });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  useEffect(() => {
    runAudit();
  }, []);

  const result = state.status === "result" ? state.data : undefined;

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        tab={tab}
        onTabChange={setTab}
        onRerun={runAudit}
        auditedAt={result?.auditedAt}
        loading={state.status === "loading"}
      />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {state.status === "loading" && (
          <p className="font-pixel text-primary text-xs animate-pulse">
            SCANNING...
          </p>
        )}

        {state.status === "error" && (
          <div className="space-y-4">
            <p className="font-pixel text-destructive text-xs">
              ERROR: {state.message}
            </p>
            <button
              onClick={runAudit}
              className="font-pixel text-[9px] px-4 py-2 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              style={{ boxShadow: "3px 3px 0px #000" }}
            >
              RETRY
            </button>
          </div>
        )}

        {state.status === "result" && result && (
          <>
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <ScoreCard label="SEO Score" category={result.seo} />
                  <ScoreCard label="Open Graph Score" category={result.og} />
                </div>
                <IssueList seo={result.seo} og={result.og} />
              </div>
            )}
            {tab === "seo" && (
              <div className="space-y-4">
                <p className="font-pixel text-[9px] text-muted-foreground">
                  SEO — {result.seo.fields.filter((f) => f.status === "pass").length}/
                  {result.seo.fields.length} PASSED
                </p>
                <AuditTable fields={result.seo.fields} />
              </div>
            )}
            {tab === "og" && (
              <div className="space-y-4">
                <p className="font-pixel text-[9px] text-muted-foreground">
                  OPEN GRAPH — {result.og.fields.filter((f) => f.status === "pass").length}/
                  {result.og.fields.length} PASSED
                </p>
                <AuditTable fields={result.og.fields} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
