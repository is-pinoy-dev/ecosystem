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
      if (!res.ok) throw new Error(`Proxy error: ${res.status}`)
      const json = (await res.json()) as {
        html: string
        xRobotsTag: string | null
      }
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
