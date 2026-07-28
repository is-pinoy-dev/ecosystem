import { NavLink } from "react-router"
import { Container } from "@is-pinoy-dev/ui/components/container"
import pkg from "../../package.json"

interface NavBarProps {
  onRerun: () => void
  auditedAt?: string
  loading: boolean
}

const TABS = [
  { to: "/", label: "Overview", end: true },
  { to: "/seo", label: "SEO", end: false },
]

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function NavBar({ auditedAt }: NavBarProps) {
  return (
    <nav className="sticky top-0 z-50 h-16 border-b border-border bg-background/98">
      <Container className="flex h-full max-w-[960px] items-center gap-6">
        <NavLink
          to="/"
          className="flex shrink-0 items-center gap-2.5 no-underline"
          aria-label="Site Audit home"
        >
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt=""
            className="size-8 shrink-0 object-contain [image-rendering:pixelated]"
          />
          <img
            src={`${import.meta.env.BASE_URL}site-audit-banner.gif`}
            alt="Site Audit — is-pinoy.dev"
            className="hidden h-6 w-auto object-contain md:block"
          />
          <span className="hidden font-mono text-xs text-muted-foreground md:block">
            v{pkg.version}
          </span>
        </NavLink>

        {/* Underlined tabs: an active yellow rule instead of a filled pixel chip. */}
        <div className="flex h-full items-stretch gap-6">
          {TABS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "relative flex items-center text-[13px] font-medium no-underline transition-colors duration-[140ms]",
                  "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:content-['']",
                  isActive
                    ? "text-foreground after:bg-primary"
                    : "text-foreground/70 after:bg-transparent hover:text-accent",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </div>

        {auditedAt && (
          <div className="ml-auto hidden shrink-0 flex-col items-end sm:flex">
            <span className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Last scan
            </span>
            <span className="font-mono text-[13px] text-foreground">
              {formatTimestamp(auditedAt)}
            </span>
          </div>
        )}
      </Container>
    </nav>
  )
}
