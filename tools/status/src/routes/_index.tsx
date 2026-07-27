import { useLoaderData } from "react-router"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { NavBar } from "~/components/nav-bar"
import { StatusBadge } from "~/components/status-badge"
import { StatusInfoPopover } from "~/components/status-info-popover"
import type { Route } from "./+types/_index"
import type { SubdomainStatus } from "~/types"

export const meta: Route.MetaFunction = () => [
  { title: "is-pinoy.dev — Status" },
]

export async function loader({ context }: Route.LoaderArgs) {
  const { results } = await context.cloudflare.env.STATUS_DB.prepare(
    "SELECT * FROM subdomain_status ORDER BY subdomain ASC"
  ).all<SubdomainStatus>()
  return { statuses: results }
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

type Accent = "success" | "destructive" | "warning" | "neutral"

const ACCENT_CLASSES: Record<Accent, string> = {
  success: "text-success",
  destructive: "text-destructive",
  warning: "text-warning",
  neutral: "text-foreground",
}

/** One cell in the metrics grid — separated by rules rather than raised cards. */
function Metric({
  label,
  value,
  sub,
  accent = "neutral",
}: {
  label: string
  value: string | number
  sub?: string
  accent?: Accent
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border p-5 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
      <span className="font-mono text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      <span
        className={`text-3xl font-semibold tracking-[-0.02em] ${ACCENT_CLASSES[accent]}`}
      >
        {value}
      </span>
      {sub && <span className="text-sm text-muted-foreground">{sub}</span>}
    </div>
  )
}

export default function StatusPage() {
  const { statuses } = useLoaderData<typeof loader>()

  const total = statuses.length
  const operational = statuses.filter((s) => s.overall === "operational").length
  const unstable = statuses.filter((s) => s.overall === "unstable").length
  const propagating = statuses.filter((s) => s.overall === "propagating").length
  const sslValid = statuses.filter((s) => s.ssl_status === "valid").length
  const sslExpiring = statuses.filter((s) => s.ssl_status === "expiring").length
  const sslExpired = statuses.filter((s) => s.ssl_status === "expired").length
  const uptimePct = total > 0 ? Math.round((operational / total) * 100) : 0

  const lastChecked =
    statuses.length > 0
      ? statuses.reduce(
          (latest, s) => (s.last_checked > latest ? s.last_checked : latest),
          statuses[0].last_checked
        )
      : null

  const overallHealthy = unstable === 0 && propagating === 0
  const overallStatus =
    unstable > 0
      ? "unstable"
      : propagating > 0
        ? "propagating"
        : total > 0
          ? "operational"
          : ("propagating" as const)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <Container className="max-w-[900px] py-14">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-1">
            <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
              System status
            </p>
            <StatusInfoPopover />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <h1 className="m-0 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              {overallHealthy
                ? "All systems operational"
                : unstable > 0
                  ? `${unstable} subdomain${unstable > 1 ? "s" : ""} degraded`
                  : `${propagating} subdomain${propagating > 1 ? "s" : ""} propagating`}
            </h1>
            <StatusBadge status={overallStatus} />
          </div>

          {lastChecked && (
            <p className="m-0 font-mono text-[13px] text-muted-foreground">
              Updated {formatRelative(lastChecked)}
            </p>
          )}
        </header>

        {total === 0 ? (
          <p className="mt-12 text-base leading-7 text-muted-foreground">
            No data yet — the first check is still pending.
          </p>
        ) : (
          <div className="mt-12 flex flex-col gap-8">
            <div className="grid grid-cols-1 border border-border sm:grid-cols-3">
              <Metric
                label="Subdomains"
                value={total}
                sub="Registered domains"
              />
              <Metric
                label="Operational"
                value={operational}
                sub={`${uptimePct}% uptime rate`}
                accent="success"
              />
              <Metric
                label="Degraded"
                value={unstable}
                sub={unstable === 0 ? "All clear" : "Needs attention"}
                accent={unstable > 0 ? "destructive" : "neutral"}
              />
            </div>

            <div className="grid grid-cols-1 border border-border sm:grid-cols-3">
              <Metric
                label="SSL valid"
                value={sslValid}
                sub={`Of ${total} checked`}
                accent="success"
              />
              <Metric
                label="SSL expiring"
                value={sslExpiring}
                sub="Within 14 days"
                accent={sslExpiring > 0 ? "warning" : "neutral"}
              />
              <Metric
                label="SSL expired"
                value={sslExpired}
                sub={sslExpired === 0 ? "None expired" : "Action required"}
                accent={sslExpired > 0 ? "destructive" : "neutral"}
              />
            </div>
          </div>
        )}
      </Container>
    </div>
  )
}
