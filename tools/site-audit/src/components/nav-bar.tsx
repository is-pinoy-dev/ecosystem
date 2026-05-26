import type { Tab } from "../lib/types";

interface NavBarProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onRerun: () => void;
  auditedAt?: string;
  loading: boolean;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "seo", label: "SEO" },
  { id: "og", label: "Open Graph" },
];

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function NavBar({ tab, onTabChange, onRerun, auditedAt, loading }: NavBarProps) {
  return (
    <nav
      className="flex items-center justify-between px-6 h-14 bg-card border-b-2 border-border"
      style={{ boxShadow: "0 4px 0px #000" }}
    >
      {/* Logo */}
      <span className="font-pixel text-primary text-xs tracking-tight whitespace-nowrap">
        is-pinoy.dev
      </span>

      {/* Tabs */}
      <div className="flex items-center gap-0">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={[
              "font-pixel text-[10px] px-4 h-14 border-x border-border transition-colors",
              tab === id
                ? "text-primary border-b-2 border-b-primary bg-background"
                : "text-muted-foreground hover:text-foreground border-b-2 border-b-transparent",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right: timestamp + re-run */}
      <div className="flex items-center gap-4">
        {auditedAt && (
          <span className="font-pixel text-[8px] text-muted-foreground hidden sm:block">
            {formatTimestamp(auditedAt)}
          </span>
        )}
        <button
          onClick={onRerun}
          disabled={loading}
          className="font-pixel text-[9px] px-3 py-2 border-2 border-primary text-primary disabled:opacity-40 hover:bg-primary hover:text-primary-foreground transition-colors"
          style={{ boxShadow: loading ? "none" : "3px 3px 0px #000" }}
        >
          {loading ? "SCANNING..." : "RE-RUN"}
        </button>
      </div>
    </nav>
  );
}
