"use client"

import { useState, useTransition } from "react"
import { ExternalLink } from "lucide-react"
import { Switch } from "@is-pinoy-dev/ui/components/switch"

import { toggleProxy } from "@/app/(dashboard)/domains/actions"
import type { ProxyableType } from "@/lib/proxy-record"

export interface ProxySwitchProps {
  subdomain: string
  type: ProxyableType
  proxied: boolean
  mixed: boolean
  /** Non-null when this record's proxy setting is pinned and cannot change. */
  lockedReason: string | null
  /** The open pull request already carrying a change for this subdomain. */
  pendingPR: PendingPR | null
}

interface PendingPR {
  url: string
  number?: number
}

/**
 * Proxy toggle for one record type. Saving never writes to Cloudflare — it
 * opens a pull request against the domains repo, so the switch is really a
 * request to change git, and it stays showing git's value until that lands.
 */
export function ProxySwitch({
  subdomain,
  type,
  proxied,
  mixed,
  lockedReason,
  pendingPR,
}: ProxySwitchProps) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  // Set once a PR is opened in this session, so the row reflects the new state
  // without waiting for a refetch.
  const [openedPR, setOpenedPR] = useState<PendingPR | null>(null)

  const pr = openedPR ?? pendingPR
  const disabled = Boolean(lockedReason) || pending || pr !== null
  const label = `${proxied ? "Disable" : "Enable"} Cloudflare proxy for the ${type} record on ${subdomain}.is-pinoy.dev`

  function onToggle(next: boolean) {
    setError(null)
    startTransition(async () => {
      const result = await toggleProxy({ subdomain, type, proxied: next })
      if (result.ok) {
        setOpenedPR({ url: result.prUrl })
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <span className="flex items-center gap-2">
        <span
          className="font-mono text-[11px] text-muted-foreground"
          aria-hidden="true"
        >
          proxied
        </span>
        <Switch
          checked={proxied}
          onCheckedChange={onToggle}
          disabled={disabled}
          aria-label={label}
          title={lockedReason ?? undefined}
        />
      </span>

      {pending ? (
        <span className="text-[11px] text-muted-foreground">
          Opening pull request…
        </span>
      ) : null}

      {!pending && pr ? (
        <a
          href={pr.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-accent no-underline hover:underline"
        >
          Change pending{pr.number ? ` · #${pr.number}` : ""}
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      ) : null}

      {!pending && !pr && mixed ? (
        <span className="text-[11px] text-warning">
          Entries disagree — toggling aligns all {type} records.
        </span>
      ) : null}

      {!pending && !pr && lockedReason ? (
        <span className="max-w-56 text-right text-[11px] text-muted-foreground">
          {lockedReason}
        </span>
      ) : null}

      {error ? (
        <span className="max-w-56 text-right text-[11px] text-destructive">
          {error}
        </span>
      ) : null}
    </span>
  )
}
