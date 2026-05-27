import { useState, useEffect, useCallback, useRef } from "react";
import { Outlet } from "react-router";
import type { AuditResult } from "@is-pinoy-dev/schemas";
import { parseAudit } from "../lib/parse-audit";
import { NavBar } from "../components/nav-bar";
import { Button } from "@is-pinoy-dev/ui/components/button";

export type AuditState =
  | { status: "loading" }
  | { status: "result"; data: AuditResult }
  | { status: "error"; message: string };

export type AuditContext = {
  state: AuditState;
  runAudit: () => void;
};

function getOrigin(): string {
  const base = import.meta.env.DEV
    ? (import.meta.env.VITE_AUDIT_TARGET ?? window.location.origin)
    : window.location.origin;
  try {
    return new URL(base).origin;
  } catch {
    return base;
  }
}

function getHost(): string {
  const base = import.meta.env.DEV
    ? (import.meta.env.VITE_AUDIT_TARGET ?? window.location.origin)
    : window.location.origin;
  try {
    return new URL(base).host;
  } catch {
    return base;
  }
}

export default function Layout() {
  const [state, setState] = useState<AuditState>({ status: "loading" });
  const [inputValue, setInputValue] = useState("/");
  const pathRef = useRef("/");

  const runAudit = useCallback(async (signal?: AbortSignal) => {
    setState({ status: "loading" });
    const target = getOrigin() + (pathRef.current.startsWith("/") ? pathRef.current : "/" + pathRef.current);
    try {
      const res = await fetch(
        `/_tools/site-audit/audit-proxy?url=${encodeURIComponent(target)}`,
        signal ? { signal } : undefined
      );
      if (!res.ok) throw new Error(`Proxy error: ${res.status}`);
      const html = await res.text();
      setState({ status: "result", data: parseAudit(html, target) });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    runAudit(controller.signal);
    return () => controller.abort();
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = inputValue.startsWith("/") ? inputValue : "/" + inputValue;
    pathRef.current = normalized;
    runAudit();
  };

  const auditedAt =
    state.status === "result" ? state.data.auditedAt : undefined;

  const origin = getOrigin();
  const host = getHost();

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        onRerun={() => runAudit()}
        auditedAt={auditedAt}
        loading={state.status === "loading"}
      />
      <div className="sticky top-16 z-40 border-b border-border bg-background/85 px-6 py-3 backdrop-blur mt-16">
        <form onSubmit={handleScan} className="max-w-4xl mx-auto flex items-center gap-2">
          <span className="font-pixel text-[9px] text-muted-foreground hidden sm:block shrink-0">AUDITING</span>
          <div className="flex items-center border-2 border-border bg-background flex-1 min-w-0 shadow-[2px_2px_0_var(--color-muted)]">
            <span className="font-pixel text-[9px] text-muted-foreground px-3 py-2 border-r-2 border-border shrink-0 truncate max-w-[180px] sm:max-w-xs">
              {host}
            </span>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="/"
              disabled={state.status === "loading"}
              className="flex-1 min-w-0 bg-transparent px-3 py-2 font-pixel text-[9px] text-foreground outline-none placeholder:text-muted-foreground/50 disabled:opacity-40"
            />
          </div>
          <Button
            type="submit"
            disabled={state.status === "loading"}
            variant="outline-shadow"
            size="sm"
          >
            SCAN
          </Button>
        </form>
      </div>
      <main className="max-w-4xl mx-auto px-6 pt-6 pb-8">
        <Outlet context={{ state, runAudit } satisfies AuditContext} />
      </main>
    </div>
  );
}
