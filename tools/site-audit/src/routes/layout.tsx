import { useState, useEffect, useCallback, useRef } from "react"
import { Outlet } from "react-router"
import type { AuditResult } from "@is-pinoy-dev/schemas"
import { parseAudit } from "../lib/parse-audit"
import { NavBar } from "../components/nav-bar"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { InputGroup } from "@is-pinoy-dev/ui/components/input-group"

export type AuditState =
  | { status: "loading" }
  | { status: "result"; data: AuditResult }
  | { status: "error"; message: string }

export type AuditContext = {
  state: AuditState
  runAudit: () => void
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
    return `${target} responded ${res.status} ${res.statusText}. There is no page at this address to audit.`
  }
  if (res.bytes === 0) {
    return `${target} responded ${res.status} with an empty body. Nothing was returned to audit.`
  }
  const type = res.contentType?.split(";")[0]?.trim().toLowerCase()
  if (type && type !== "text/html" && type !== "application/xhtml+xml") {
    return `${target} returned ${type}, not HTML. Point the scan at a page rather than an asset or an API route.`
  }
  if (!/<html[\s>]/i.test(res.html)) {
    return `${target} returned ${res.bytes} bytes that are not an HTML document. Nothing was returned to audit.`
  }
  if (res.finalUrl && !sameOrigin(res.finalUrl, target)) {
    return `${target} redirected to ${res.finalUrl}, which is a different origin. The audit would grade that site, not this one.`
  }
  return null
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
  const [inputValue, setInputValue] = useState("/")
  const pathRef = useRef("/")

  const runAudit = useCallback(async (signal?: AbortSignal) => {
    setState({ status: "loading" })
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
        <Outlet context={{ state, runAudit } satisfies AuditContext} />
      </Container>
    </div>
  )
}
