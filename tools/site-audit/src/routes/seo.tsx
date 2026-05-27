import { useOutletContext } from "react-router";
import { Button } from "@is-pinoy-dev/ui/components/button";
import type { AuditContext } from "./layout";
import { AuditTable } from "../components/audit-table";

export function meta() {
  return [
    { title: "SEO — Site Audit | is-pinoy.dev" },
    { name: "description", content: "SEO audit details" },
  ];
}

export default function Seo() {
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

  const { seo } = state.data;
  const passed = seo.fields.filter((f) => f.status === "pass").length;

  return (
    <div className="space-y-4">
      <p className="font-pixel text-[11px] text-muted-foreground">
        SEO — {passed}/{seo.fields.length} PASSED
      </p>
      <AuditTable fields={seo.fields} />
    </div>
  );
}
