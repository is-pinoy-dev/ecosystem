import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router";
import type { AuditResult } from "@is-pinoy-dev/schemas";
import { parseAudit } from "../lib/parse-audit";
import { NavBar } from "../components/nav-bar";

export type AuditState =
  | { status: "loading" }
  | { status: "result"; data: AuditResult }
  | { status: "error"; message: string };

export type AuditContext = {
  state: AuditState;
  runAudit: () => void;
};

export default function Layout() {
  const [state, setState] = useState<AuditState>({ status: "loading" });

  const runAudit = useCallback(async (signal?: AbortSignal) => {
    setState({ status: "loading" });
    const target = import.meta.env.DEV
      ? (import.meta.env.VITE_AUDIT_TARGET ?? window.location.origin)
      : window.location.origin;
    try {
      const res = await fetch(
        `/audit-proxy?url=${encodeURIComponent(target)}`,
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

  const auditedAt =
    state.status === "result" ? state.data.auditedAt : undefined;

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        onRerun={() => runAudit()}
        auditedAt={auditedAt}
        loading={state.status === "loading"}
      />
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-8">
        <Outlet context={{ state, runAudit } satisfies AuditContext} />
      </main>
    </div>
  );
}
