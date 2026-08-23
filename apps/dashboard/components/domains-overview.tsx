import Link from "next/link"
import { ArrowRight, ArrowUpRight, GitPullRequest, Plus } from "lucide-react"

import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"

import { ProviderMark } from "@/components/provider-mark"
import { VisitsSparkline } from "@/components/visits-sparkline"
import type { VisitsReport } from "@/lib/analytics"
import {
  primaryRouteFor,
  type DomainView,
  type PendingPRView,
} from "@/lib/domain-view"

interface Props {
  domains: DomainView[]
  pending: Record<string, PendingPRView>
  /** Null when the analytics database isn't configured for this deployment. */
  visits: VisitsReport | null
}

function syncTone(
  status: DomainView["syncStatus"]
): "success" | "warning" | "destructive" {
  if (status === "failed") return "destructive"
  if (status === "pending") return "warning"
  return "success"
}

function syncLabel(status: DomainView["syncStatus"]): string {
  if (status === "failed") return "Needs attention"
  if (status === "pending") return "Syncing"
  return "Active"
}

function platformLabel(domain: DomainView): string {
  if (!domain.platform) return "DNS only"
  if (!domain.platform.enabled) return "Platform off"
  const tools = domain.platform.features.filter((feature) => feature.enabled)
  return tools.length > 0
    ? `${tools.length} tool${tools.length === 1 ? "" : "s"} on`
    : "Platform on"
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-3 first:pl-0 sm:px-6">
      <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
        {value}
      </span>
    </div>
  )
}

export function DomainsOverview({ domains, pending, visits }: Props) {
  const active = domains.filter(
    (domain) =>
      domain.syncStatus !== "failed" && domain.syncStatus !== "pending"
  ).length
  const pendingCount = Object.keys(pending).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-y border-border">
        <div className="grid flex-1 grid-cols-3 divide-x divide-border">
          <SummaryStat label="Domains" value={domains.length} />
          <SummaryStat label="Active" value={active} />
          <SummaryStat label="Open changes" value={pendingCount} />
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mb-3 max-sm:hidden"
        >
          <a
            href="https://is-pinoy.dev/#claim"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Plus aria-hidden="true" />
            Claim another
          </a>
        </Button>
      </div>

      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {domains.map((domain) => {
          const route = primaryRouteFor(domain)
          const openPR = pending[domain.subdomain]
          const subdomainVisits = visits?.bySubdomain[domain.subdomain]
          const analyticsEnabled =
            domain.platform?.features.find(
              (feature) => feature.id === "analytics"
            )?.enabled ?? false
          const showVisits = Boolean(
            visits?.through &&
              domain.platform?.enabled &&
              analyticsEnabled &&
              subdomainVisits
          )

          return (
            <li
              key={domain.subdomain}
              className="group flex flex-col border border-border bg-card transition-colors hover:border-foreground/30"
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center border border-border bg-background text-foreground"
                    title={domain.provider?.name ?? "Domain"}
                  >
                    {domain.provider ? (
                      <ProviderMark provider={domain.provider} />
                    ) : (
                      <StatusIndicator tone={syncTone(domain.syncStatus)} />
                    )}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <Link
                        href={`/domains/${domain.subdomain}`}
                        className="truncate font-mono text-sm font-semibold text-foreground no-underline group-hover:text-accent group-hover:underline"
                      >
                        {domain.fqdn}
                      </Link>
                      <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <StatusIndicator
                          tone={syncTone(domain.syncStatus)}
                          className="size-1.5"
                        />
                        {syncLabel(domain.syncStatus)}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {route ? (
                        <>
                          <Badge variant="secondary" className="shrink-0">
                            {route.type}
                          </Badge>
                          <code className="max-w-full truncate font-mono text-[11px]">
                            {route.value}
                          </code>
                        </>
                      ) : (
                        <span>No routing record</span>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{domain.provider?.name ?? "Custom host"}</span>
                      <span aria-hidden="true">·</span>
                      <span>{platformLabel(domain)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-auto">
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={domain.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Visit
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={`/domains/${domain.subdomain}`}>
                      Manage
                      <ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </div>

              {showVisits && subdomainVisits ? (
                <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                      Visits · 7d
                    </span>
                    <span className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                      {subdomainVisits.total.toLocaleString("en-US")}
                    </span>
                  </div>
                  <VisitsSparkline
                    id={domain.subdomain}
                    points={subdomainVisits.series.map((point) => point.visits)}
                    className="shrink-0 text-foreground/70"
                  />
                </div>
              ) : null}

              {openPR ? (
                <a
                  href={openPR.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground no-underline hover:text-accent"
                >
                  <GitPullRequest className="size-3.5" aria-hidden="true" />
                  Change #{openPR.number} is waiting for review
                  <ArrowUpRight
                    className="ml-auto size-3.5"
                    aria-hidden="true"
                  />
                </a>
              ) : null}
            </li>
          )
        })}
      </ul>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="self-start sm:hidden"
      >
        <a
          href="https://is-pinoy.dev/#claim"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Plus aria-hidden="true" />
          Claim another domain
        </a>
      </Button>
    </div>
  )
}
