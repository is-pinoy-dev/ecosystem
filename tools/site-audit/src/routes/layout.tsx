import { useState, useEffect, useCallback, useRef } from "react"
import { Outlet } from "react-router"
import type { AuditResult, PsiResult, PsiStrategy } from "@is-pinoy-dev/schemas"
import { parseAudit } from "../lib/parse-audit"
import { NavBar } from "../components/nav-bar"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { InputGroup } from "@is-pinoy-dev/ui/components/input-group"

export type AuditState =
  | { status: "loading" }
  | { status: "result"; data: AuditResult }
  | { status: "error"; message: string }

export type PsiState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "result"; data: PsiResult }
  | { status: "error"; message: string }

export type AuditContext = {
  state: AuditState
  runAudit: () => void
  psiState: PsiState
  /** Owned here, not by the Performance route, so Overview's radar can read the same result. */
  runPsi: (strategy: PsiStrategy) => void
}

/** What /audit-proxy hands back about the fetch, alongside the bytes. */
type ProxyResponse = {
  html: string
  xRobotsTag: string | null
  status: number
  statusText: string
  contentType: string | null
  bytes: number
  finalUrl: string
  portfolioRoute: string | null
}

/**
 * What a hosted portfolio's own routing verdict means, when the fetch came
 * back unusable. `x-portfolio-route` is set by apps/portfolio/proxy.ts on every
 * response; these are the values that explain a page that didn't render.
 *
 * `worker` is the healthy verdict and still belongs here. Printed bare it reads
 * like a fault code — it was the whole of the message the first time a
 * self-hosted subdomain was wrongly scanned as a portfolio — when what it
 * actually rules out is the entire routing half of the problem.
 */
const ROUTE_DIAGNOSIS: Record<string, string> = {
  worker:
    "Routing itself worked — the renderer received this subdomain and answered for it, so the failure is about what it had to serve rather than how the request arrived. Check that the subdomain's record still carries a portfolio block and that the GitHub profile it names is reachable.",
  unlabelled:
    "The renderer saw no subdomain on this request, so it had no portfolio to render. Check that a Worker route exists for this subdomain.",
  "no-secret":
    "The Worker sent a subdomain but the running renderer deployment has no PORTFOLIO_PROXY_SECRET to check it against — usually a value added to the project but never redeployed.",
  "secret-mismatch":
    "The Worker's PORTFOLIO_PROXY_SECRET does not match the renderer's. Check for a trailing newline on either copy.",
  "bad-label":
    "The Worker sent a subdomain the renderer rejected as malformed.",
}

/**
 * Why this response can't be graded, or null if it can.
 *
 * An HTML parser accepts anything. A 404 body, an empty response and a JSON
 * error all become a valid Document with an empty <head>, and every check then
 * reports its field as missing — so a page that was never fetched scores like a
 * page with no metadata at all, and the report reads as the site's fault. Each
 * case below is a fetch that failed, and saying so is the whole report.
 */
function unscorable(res: ProxyResponse, target: string): string | null {
  if (res.status < 200 || res.status >= 300) {
    return withDiagnosis(
      `${target} responded ${res.status} ${res.statusText}. There is no page at this address to audit.`,
      res,
    )
  }
  if (res.bytes === 0) {
    return withDiagnosis(
      `${target} responded ${res.status} with an empty body. Nothing was returned to audit.`,
      res,
    )
  }
  const type = res.contentType?.split(";")[0]?.trim().toLowerCase()
  if (type && type !== "text/html" && type !== "application/xhtml+xml") {
    return `${target} returned ${type}, not HTML. Point the scan at a page rather than an asset or an API route.`
  }
  if (!/<html[\s>]/i.test(res.html)) {
    return withDiagnosis(
      `${target} returned ${res.bytes} bytes that are not an HTML document. Nothing was returned to audit.`,
      res,
    )
  }
  if (res.finalUrl && !sameOrigin(res.finalUrl, target)) {
    return `${target} redirected to ${res.finalUrl}, which is a different origin. The audit would grade that site, not this one.`
  }
  return null
}

/** Append the renderer's own account of the request, when it gave one. */
function withDiagnosis(message: string, res: ProxyResponse): string {
  const route = res.portfolioRoute
  if (!route) return message
  const explanation = ROUTE_DIAGNOSIS[route]
  return explanation
    ? `${message} The renderer reported x-portfolio-route: ${route}. ${explanation}`
    : `${message} The renderer reported x-portfolio-route: ${route}.`
}

/** Unparseable either way is not evidence of a redirect; don't invent one. */
function sameOrigin(a: string, b: string): boolean {
  try {
    return new URL(a).origin === new URL(b).origin
  } catch {
    return true
  }
}

function getOrigin(): string {
  if (typeof window === "undefined") return ""
  const base = import.meta.env.DEV
    ? (import.meta.env.VITE_AUDIT_TARGET ?? window.location.origin)
    : window.location.origin
  try {
    return new URL(base).origin
  } catch {
    return base
  }
}

function getHost(): string {
  if (typeof window === "undefined") return ""
  const base = import.meta.env.DEV
    ? (import.meta.env.VITE_AUDIT_TARGET ?? window.location.origin)
    : window.location.origin
  try {
    return new URL(base).host
  } catch {
    return base
  }
}

export default function Layout() {
  const [state, setState] = useState<AuditState>({ status: "loading" })
  const [psiState, setPsiState] = useState<PsiState>({ status: "idle" })
  const [inputValue, setInputValue] = useState("/")
  const pathRef = useRef("/")
  const savedSignatureRef = useRef<string | null>(null)

  const runPsi = useCallback(
    async (strategy: PsiStrategy) => {
      if (state.status !== "result") return
      const target = state.data.url
      setPsiState({ status: "loading" })
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
        setPsiState({ status: "result", data })
      } catch (err) {
        setPsiState({
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        })
      }
    },
    [state]
  )

  const runAudit = useCallback(async (signal?: AbortSignal) => {
    setState({ status: "loading" })
    // A fresh scan may target a different path than the last PageSpeed run —
    // don't let its result linger and look like it describes this one.
    setPsiState({ status: "idle" })
    const target =
      getOrigin() +
      (pathRef.current.startsWith("/")
        ? pathRef.current
        : "/" + pathRef.current)
    try {
      const res = await fetch(
        `/_tools/site-audit/audit-proxy?url=${encodeURIComponent(target)}`,
        signal ? { signal } : undefined
      )
      if (!res.ok) {
        // The proxy's own refusals are plain text and say why (blocked host,
        // bad URL, upstream timeout); relaying the status alone loses that.
        throw new Error((await res.text()).trim() || `Proxy error: ${res.status}`)
      }
      const json = (await res.json()) as ProxyResponse
      const problem = unscorable(json, target)
      if (problem) throw new Error(problem)
      setState({
        status: "result",
        data: parseAudit(json.html, target, json.xRobotsTag),
      })
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    runAudit(controller.signal)
    return () => controller.abort()
  }, [runAudit])

  // Persist the latest scan so it survives a reload and the dashboard can
  // show it too (see worker/index.ts's /save-audit handler). Fire-and-forget:
  // a failed save must never surface as a failed scan. Keyed on auditedAt +
  // the PSI run's own fetchedAt so a re-render doesn't repost the same pair.
  useEffect(() => {
    if (state.status !== "result") return
    const psi = psiState.status === "result" ? psiState.data : null
    const signature = `${state.data.auditedAt}:${psi?.fetchedAt ?? ""}`
    if (savedSignatureRef.current === signature) return
    savedSignatureRef.current = signature
    fetch("/_tools/site-audit/save-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: state.data.url,
        auditedAt: state.data.auditedAt,
        seo: state.data.seo,
        og: state.data.og,
        psi,
      }),
      keepalive: true,
    }).catch(() => {})
  }, [state, psiState])

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = inputValue.startsWith("/")
      ? inputValue
      : "/" + inputValue
    pathRef.current = normalized
    runAudit()
  }

  const auditedAt = state.status === "result" ? state.data.auditedAt : undefined

  const host = getHost()

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        onRerun={() => runAudit()}
        auditedAt={auditedAt}
        loading={state.status === "loading"}
      />
      <div className="sticky top-16 z-40 border-b border-border bg-background/98 py-3">
        <Container className="max-w-[960px]">
          <form onSubmit={handleScan} className="flex items-center gap-3">
            <label
              htmlFor="audit-path"
              className="hidden shrink-0 font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase sm:block"
            >
              Auditing
            </label>
            <InputGroup className="min-h-10 min-w-0 flex-1">
              <span className="flex max-w-[180px] shrink-0 items-center truncate border-r border-border px-3 font-mono text-[13px] text-muted-foreground sm:max-w-xs">
                {host}
              </span>
              <input
                id="audit-path"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="/"
                disabled={state.status === "loading"}
                className="min-w-0 flex-1 bg-transparent px-3 font-mono text-[13px] text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
              />
            </InputGroup>
            <Button type="submit" disabled={state.status === "loading"}>
              Scan
            </Button>
          </form>
        </Container>
      </div>
      <Container className="max-w-[960px] py-8">
        <Outlet
          context={{ state, runAudit, psiState, runPsi } satisfies AuditContext}
        />
      </Container>
    </div>
  )
}
