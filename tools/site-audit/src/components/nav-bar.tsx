import { NavLink } from "react-router"
import pkg from "../../package.json"

interface NavBarProps {
  onRerun: () => void
  auditedAt?: string
  loading: boolean
}

const TABS = [
  { to: "/", label: "OVERVIEW", end: true },
  { to: "/seo", label: "SEO", end: false },
]

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function NavBar({ onRerun, auditedAt, loading }: NavBarProps) {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center border-b-1 border-b-muted bg-background/85 px-6 backdrop-blur">
      {/* Logo + banner */}
      <NavLink to="/" className="group flex shrink-0 items-center">
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          alt="is-pinoy.dev logo"
          className="h-8 w-auto [image-rendering:pixelated] group-hover:animate-spin"
        />
        <img
          src={`${import.meta.env.BASE_URL}site-audit-banner.gif`}
          alt="Site Audit — is-pinoy.dev"
          className="hidden h-7 w-auto md:block"
        />
        <span className="mt-3.5 -ml-1.5 hidden font-pixel text-[9px] text-muted-foreground md:block">
          v{pkg.version}
        </span>
      </NavLink>

      {/* Tabs */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center border-2 border-border bg-background/60 shadow-[4px_4px_0_var(--color-muted)]">
        {TABS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "border-r-2 border-border px-3 py-1.5 font-pixel text-[8px] uppercase transition-colors last:border-r-0 md:px-5 md:py-2.5 md:text-[11px]",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")
            }
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right: timestamp */}
      <div className="ml-auto flex shrink-0 items-center">
        {auditedAt && (
          <span className="hidden font-pixel text-[9px] text-muted-foreground sm:block">
            {formatTimestamp(auditedAt)}
          </span>
        )}
      </div>
    </nav>
  )
}
