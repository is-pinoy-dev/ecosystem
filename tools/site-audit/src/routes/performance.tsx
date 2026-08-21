import { useState } from "react"
import { useOutletContext } from "react-router"
import { Tabs, TabsList, TabsTrigger } from "@is-pinoy-dev/ui/components/tabs"
import { Button } from "@is-pinoy-dev/ui/components/button"
import type { PsiResult, PsiStrategy } from "@is-pinoy-dev/schemas"
import type { AuditContext } from "./layout"
import { ErrorState, ScanningState } from "../components/audit-states"
import { PsiScoreCard } from "../components/psi-score-card"
import { StatusBadge } from "../components/status-badge"

type PsiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "result"; data: PsiResult }
  | { status: "error"; message: string }

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
      {children}
    </p>
  )
}

export function meta() {
  return [
    { title: "Performance — Site Audit | is-pinoy.dev" },
    { name: "description", content: "PageSpeed Insights performance audit" },
  ]
}

export default function Performance() {
  const { state: seoState } = useOutletContext<AuditContext>()
  const [strategy, setStrategy] = useState<PsiStrategy>("mobile")
  const [psi, setPsi] = useState<PsiState>({ status: "idle" })

  if (seoState.status === "loading") return <ScanningState />

  if (seoState.status === "error") {
    return (
      <ErrorState
        message={seoState.message}
        onRetry={() => window.location.reload()}
      />
    )
  }

  const target = seoState.data.url

  async function run() {
    setPsi({ status: "loading" })
    try {
      const res = await fetch(
        `/_tools/site-audit/psi-proxy?url=${encodeURIComponent(target)}&strategy=${strategy}`
      )
      if (!res.ok) {
        throw new Error(
          (await res.text()).trim() || `PageSpeed error: ${res.status}`
        )
      }
      const data = (await res.json()) as PsiResult
      setPsi({ status: "result", data })
    } catch (err) {
      setPsi({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Eyebrow>Performance</Eyebrow>
        <h1 className="m-0 text-2xl font-semibold tracking-[-0.02em] text-foreground">
          Google PageSpeed Insights
        </h1>
        <p className="m-0 text-sm text-muted-foreground">
          Runs a live Lighthouse audit against{" "}
          <span className="font-mono text-[13px]">{target}</span> via
          Google&apos;s PageSpeed Insights API. This can take up to 30
          seconds.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs
          value={strategy}
          onValueChange={(v) => setStrategy(v as PsiStrategy)}
        >
          <TabsList>
            <TabsTrigger value="mobile">Mobile</TabsTrigger>
            <TabsTrigger value="desktop">Desktop</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={run} disabled={psi.status === "loading"}>
          {psi.status === "loading"
            ? "Running…"
            : psi.status === "result"
              ? "Re-run"
              : "Run PageSpeed check"}
        </Button>
      </div>

      {psi.status === "error" && (
        <ErrorState message={psi.message} onRetry={run} />
      )}

      {psi.status === "result" && <PsiResults data={psi.data} />}
    </div>
  )
}

function PsiResults({ data }: { data: PsiResult }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {data.categories.map((cat) => (
          <PsiScoreCard key={cat.id} label={cat.title} score={cat.score} />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <Eyebrow>Core Web Vitals</Eyebrow>
        <div className="overflow-x-auto border border-border bg-card">
          <div className="min-w-[480px] divide-y divide-border">
            {data.vitals.map((vital) => (
              <div
                key={vital.id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2.5"
              >
                <p className="m-0 text-sm text-foreground">{vital.title}</p>
                <p className="m-0 font-mono text-[13px] text-muted-foreground">
                  {vital.displayValue ?? "—"}
                </p>
                <StatusBadge status={vital.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.opportunities.length > 0 && (
        <div className="flex flex-col gap-3">
          <Eyebrow>Opportunities</Eyebrow>
          <div className="divide-y divide-border border border-border bg-card">
            {data.opportunities.map((op) => (
              <div key={op.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <p className="m-0 text-sm text-foreground">{op.title}</p>
                  {op.displayValue && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {op.displayValue}
                    </span>
                  )}
                </div>
                {op.description && (
                  <p className="m-0 text-sm text-muted-foreground">
                    {op.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="m-0 text-xs text-muted-foreground">
        {data.strategy === "mobile" ? "Mobile" : "Desktop"} report fetched{" "}
        {new Date(data.fetchedAt).toLocaleTimeString()}
      </p>
    </div>
  )
}
