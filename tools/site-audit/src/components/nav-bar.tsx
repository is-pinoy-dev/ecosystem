import type { Tab } from "../lib/types"
import { Button } from "@is-pinoy-dev/ui/components/button"

interface NavBarProps {
  tab: Tab
  onTabChange: (tab: Tab) => void
  onRerun: () => void
  auditedAt?: string
  loading: boolean
}

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "OVERVIEW" },
  { id: "seo", label: "SEO" },
  { id: "og", label: "OG" },
]

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function NavBar({
  tab,
  onTabChange,
  onRerun,
  auditedAt,
  loading,
}: NavBarProps) {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b-1 border-b-muted bg-background/85 px-6 backdrop-blur">
      {/* Logo + banner */}
      <div className="flex shrink-0 items-center gap-3">
        <img
          src="/logo.png"
          alt="is-pinoy.dev logo"
          className="h-8 w-auto [image-rendering:pixelated] hover:animate-spin"
        />
        <img
          src="/site-audit-banner.gif"
          alt="Site Audit — is-pinoy.dev"
          className="-ml-3 hidden h-7 w-auto md:block"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center border-2 border-border bg-background/60 shadow-[4px_4px_0_var(--color-muted)]">
        {TABS.map(({ id, label }) => (
          <button
            type="button"
            key={id}
            onClick={() => onTabChange(id)}
            className={[
              "border-r-2 border-border px-5 py-2.5 font-pixel text-[11px] transition-colors last:border-r-0",
              tab === id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Right: timestamp + re-run */}
      <div className="flex shrink-0 items-center gap-4">
        {auditedAt && (
          <span className="hidden font-pixel text-[11px] text-muted-foreground sm:block">
            {formatTimestamp(auditedAt)}
          </span>
        )}
        <Button
          onClick={onRerun}
          disabled={loading}
          variant="outline-shadow"
          size="sm"
          className={loading ? "opacity-40" : ""}
        >
          {loading ? "SCANNING..." : "RE-RUN"}
        </Button>
      </div>
    </nav>
  )
}
