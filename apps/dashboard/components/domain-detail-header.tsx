"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Copy,
  FilePenLine,
  GitPullRequest,
} from "lucide-react"

import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"

import { ProviderMark } from "@/components/provider-mark"
import { RefreshPreviewButton } from "@/components/refresh-preview-button"
import {
  primaryRouteFor,
  type DomainView,
  type PendingPRView,
} from "@/lib/domain-view"

function syncTone(
  status: DomainView["syncStatus"]
): "success" | "warning" | "destructive" {
  if (status === "failed") return "destructive"
  if (status === "pending") return "warning"
  return "success"
}

function syncLabel(status: DomainView["syncStatus"]): string {
  if (status === "failed") return "Sync failed"
  if (status === "pending") return "Sync pending"
  return "Active"
}

export function DomainDetailHeader({
  domain,
  pendingPR,
}: {
  domain: DomainView
  pendingPR: PendingPRView | null
}) {
  const [copied, setCopied] = useState(false)
  const route = primaryRouteFor(domain)

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(domain.siteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // The address remains visible and selectable if clipboard access is denied.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/domains"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground no-underline hover:text-accent"
      >
        <ArrowLeft className="size-3.5" aria-hidden="true" />
        All domains
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 flex size-11 shrink-0 items-center justify-center border border-border bg-card text-foreground"
            title={domain.provider?.name ?? "Domain"}
          >
            {domain.provider ? (
              <ProviderMark provider={domain.provider} />
            ) : (
              <StatusIndicator tone={syncTone(domain.syncStatus)} />
            )}
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Domain details
            </span>
            <h1 className="m-0 font-mono text-xl font-semibold tracking-[-0.03em] break-words text-foreground sm:text-3xl">
              {domain.fqdn}
            </h1>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <StatusIndicator
                  tone={syncTone(domain.syncStatus)}
                  className="size-1.5"
                />
                {syncLabel(domain.syncStatus)}
              </span>
              {domain.provider ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{domain.provider.name}</span>
                </>
              ) : null}
              {domain.synced ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Synced {domain.synced}</span>
                </>
              ) : null}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild>
            <a href={domain.siteUrl} target="_blank" rel="noopener noreferrer">
              Visit site
              <ArrowUpRight aria-hidden="true" />
            </a>
          </Button>
          <Button variant="outline" onClick={copyUrl}>
            {copied ? (
              <Check aria-hidden="true" />
            ) : (
              <Copy aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy URL"}
          </Button>
          <Button asChild variant="outline">
            <a
              href={domain.recordEditUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FilePenLine aria-hidden="true" />
              Edit DNS
            </a>
          </Button>
        </div>
      </div>

      <section
        aria-labelledby="routing-heading"
        className="border border-border bg-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <h2
              id="routing-heading"
              className="m-0 text-sm font-semibold text-foreground"
            >
              Where this domain goes
            </h2>
            <p className="mt-0.5 mb-0 text-[11px] text-muted-foreground">
              DNS routing keeps the public address in the browser; it is not a
              URL redirect.
            </p>
          </div>
          {pendingPR ? (
            <Button asChild variant="outline" size="sm">
              <a href={pendingPR.url} target="_blank" rel="noopener noreferrer">
                <GitPullRequest aria-hidden="true" />
                Review change #{pendingPR.number}
              </a>
            </Button>
          ) : null}
        </div>

        <div className="grid items-stretch md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-1.5 p-4">
            <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              Public address
            </span>
            <a
              href={domain.siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-mono text-sm font-medium text-foreground no-underline hover:text-accent hover:underline"
            >
              {domain.siteUrl}
            </a>
          </div>

          <span className="flex items-center justify-center border-y border-border px-4 py-2 text-muted-foreground md:border-x md:border-y-0">
            <ArrowRight
              className="size-4 rotate-90 md:rotate-0"
              aria-hidden="true"
            />
            <span className="sr-only">routes to</span>
          </span>

          <div className="flex min-w-0 flex-col gap-1.5 p-4">
            <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
              DNS destination
            </span>
            {route ? (
              <span className="flex min-w-0 items-center gap-2">
                <Badge variant="secondary">{route.type}</Badge>
                <code className="truncate font-mono text-xs text-foreground">
                  {route.value}
                </code>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">
                No routing record
              </span>
            )}
          </div>
        </div>
      </section>

      {domain.provider?.id === "portfolio" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="m-0 text-sm font-medium text-foreground">
              Hosted portfolio preview
            </p>
            <p className="mt-0.5 mb-0 text-xs text-muted-foreground">
              Refresh the showcase image after your profile or theme changes.
            </p>
          </div>
          <RefreshPreviewButton portfolioId={domain.subdomain} />
        </div>
      ) : null}
    </div>
  )
}
