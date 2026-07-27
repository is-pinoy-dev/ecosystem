"use client"

import { useMemo, useState, useTransition } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  GitPullRequest,
  Loader2,
  XCircle,
} from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@is-pinoy-dev/ui/components/dialog"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"
import { Switch } from "@is-pinoy-dev/ui/components/switch"
import { cn } from "@is-pinoy-dev/ui/lib/utils"

import {
  saveProxyChanges,
  type ProxyChangeInput,
  type SubdomainSaveResult,
} from "@/app/(dashboard)/domains/actions"
import { ProviderMark } from "@/components/provider-mark"
import { providerForRow, type DomainView } from "@/lib/domain-view"
import type { ProxyableType } from "@/lib/proxy-record"

export interface PendingPRView {
  url: string
  number: number
}

interface Props {
  domains: DomainView[]
  /** Open proxy pull requests keyed by subdomain. */
  pending: Record<string, PendingPRView>
}

/** Identity of one editable switch. */
function editKey(subdomain: string, type: ProxyableType) {
  return `${subdomain}:${type}`
}

export function syncTone(
  status: DomainView["syncStatus"]
): "success" | "warning" | "destructive" {
  if (status === "failed") return "destructive"
  if (status === "pending") return "warning"
  return "success"
}

export function syncLabel(status: DomainView["syncStatus"]): string {
  if (status === "failed") return "Sync failed"
  if (status === "pending") return "Sync pending"
  return "Active"
}

/**
 * The domains listing, with staged proxy edits.
 *
 * Toggling a switch changes nothing but local state — no request is made until
 * "Save changes", which opens one pull request per edited subdomain after
 * confirmation. That keeps a mis-click free and makes the git-backed workflow
 * explicit rather than surprising.
 */
export function DomainsManager({ domains, pending }: Props) {
  const [edits, setEdits] = useState<Record<string, boolean>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [results, setResults] = useState<SubdomainSaveResult[] | null>(null)
  const [saving, startSaving] = useTransition()

  // An edit only counts while it differs from what git says.
  const changes = useMemo<ProxyChangeInput[]>(() => {
    const list: ProxyChangeInput[] = []
    for (const domain of domains) {
      for (const row of domain.records) {
        if (!row.proxy || row.proxy.lockedReason) continue
        const key = editKey(domain.subdomain, row.proxy.type)
        const staged = edits[key]
        if (staged === undefined) continue
        if (staged === row.proxy.proxied && !row.proxy.mixed) continue
        list.push({
          subdomain: domain.subdomain,
          type: row.proxy.type,
          proxied: staged,
        })
      }
    }
    return list
  }, [domains, edits])

  const affected = useMemo(
    () => [...new Set(changes.map((c) => c.subdomain))],
    [changes]
  )

  function onSave() {
    setResults(null)
    startSaving(async () => {
      const result = await saveProxyChanges(changes)
      setResults(result.results)
      // Clear the staged edits that landed; failures stay staged so the user
      // can retry without re-toggling everything.
      const succeeded = new Set(
        result.results.filter((r) => r.ok).map((r) => r.subdomain)
      )
      if (succeeded.size > 0) {
        setEdits((current) =>
          Object.fromEntries(
            Object.entries(current).filter(
              ([key]) => !succeeded.has(key.split(":")[0]!)
            )
          )
        )
      }
    })
  }

  function closeDialog() {
    if (saving) return
    setConfirmOpen(false)
    setResults(null)
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {domains.map((domain) => (
          <DomainCard
            key={domain.subdomain}
            domain={domain}
            pendingPR={pending[domain.subdomain] ?? null}
            edits={edits}
            onToggle={(type, next) =>
              setEdits((current) => ({
                ...current,
                [editKey(domain.subdomain, type)]: next,
              }))
            }
          />
        ))}
      </div>

      {changes.length > 0 ? (
        <SaveBar
          count={changes.length}
          domainCount={affected.length}
          onDiscard={() => setEdits({})}
          onSave={() => {
            setResults(null)
            setConfirmOpen(true)
          }}
        />
      ) : null}

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => (open ? setConfirmOpen(true) : closeDialog())}
      >
        <DialogContent showCloseButton={!saving}>
          {results ? (
            <ResultsView results={results} onClose={closeDialog} />
          ) : (
            <ConfirmView
              changes={changes}
              domains={domains}
              affected={affected}
              saving={saving}
              onCancel={closeDialog}
              onConfirm={onSave}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

/** What saving will actually do, spelled out before anything is created. */
function ConfirmView({
  changes,
  domains,
  affected,
  saving,
  onCancel,
  onConfirm,
}: {
  changes: ProxyChangeInput[]
  domains: DomainView[]
  affected: string[]
  saving: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const prCount = affected.length

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Open {prCount} pull request{prCount === 1 ? "" : "s"}?
        </DialogTitle>
        <DialogDescription>
          The registry is stored in git, so the dashboard does not change DNS
          directly. Saving opens{" "}
          {prCount === 1 ? "a pull request" : `${prCount} pull requests`}{" "}
          against the{" "}
          <span className="font-mono text-foreground">
            is-pinoy-dev/domains
          </span>{" "}
          repository — one per domain — on your behalf.
        </DialogDescription>
      </DialogHeader>

      <ul className="m-0 flex list-none flex-col gap-0 border border-border p-0">
        {changes.map((change) => {
          const domain = domains.find((d) => d.subdomain === change.subdomain)
          return (
            <li
              key={`${change.subdomain}:${change.type}`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-3 py-2 text-xs last:border-b-0"
            >
              <Badge variant="secondary" className="w-14 justify-center">
                {change.type}
              </Badge>
              <span className="min-w-0 flex-1 truncate font-mono text-foreground">
                {domain?.fqdn ?? change.subdomain}
              </span>
              <span className="font-mono text-muted-foreground">
                proxied →{" "}
                <span
                  className={cn(
                    "font-medium",
                    change.proxied ? "text-success" : "text-warning"
                  )}
                >
                  {String(change.proxied)}
                </span>
              </span>
            </li>
          )
        })}
      </ul>

      <p className="m-0 flex items-start gap-2.5 border border-border bg-muted/40 p-3 text-xs/relaxed text-muted-foreground">
        <AlertTriangle
          className="mt-0.5 size-4 shrink-0 text-warning"
          aria-hidden="true"
        />
        <span>
          Nothing takes effect until a maintainer reviews and merges the pull
          request, and the next sync applies it. Until then your domain keeps
          its current setting and the switch stays showing it.
        </span>
      </p>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Opening…
            </>
          ) : (
            <>
              <GitPullRequest aria-hidden="true" />
              Open pull request{prCount === 1 ? "" : "s"}
            </>
          )}
        </Button>
      </DialogFooter>
    </>
  )
}

function ResultsView({
  results,
  onClose,
}: {
  results: SubdomainSaveResult[]
  onClose: () => void
}) {
  const opened = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {opened.length > 0
            ? `Opened ${opened.length} pull request${opened.length === 1 ? "" : "s"}`
            : "Nothing was opened"}
        </DialogTitle>
        <DialogDescription>
          {opened.length > 0
            ? "Your domains keep their current settings until these are merged and the next sync runs."
            : "No pull request was created."}
        </DialogDescription>
      </DialogHeader>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {opened.map((result) => (
          <li
            key={result.subdomain}
            className="flex items-start gap-2.5 border border-border p-3 text-xs/relaxed"
          >
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="font-mono text-foreground">
                {result.subdomain}.is-pinoy.dev
              </span>{" "}
              —{" "}
              <a
                href={result.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                view pull request
              </a>
            </span>
          </li>
        ))}
        {failed.map((result) => (
          <li
            key={result.subdomain || "error"}
            className="flex items-start gap-2.5 border border-destructive/35 bg-destructive/5 p-3 text-xs/relaxed"
          >
            <XCircle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              {result.subdomain ? (
                <>
                  <span className="font-mono text-foreground">
                    {result.subdomain}.is-pinoy.dev
                  </span>{" "}
                  — {result.error}
                </>
              ) : (
                result.error
              )}
            </span>
          </li>
        ))}
      </ul>

      <DialogFooter>
        <Button onClick={onClose}>Done</Button>
      </DialogFooter>
    </>
  )
}

/** Sticky action bar — only present while there is something to save. */
function SaveBar({
  count,
  domainCount,
  onDiscard,
  onSave,
}: {
  count: number
  domainCount: number
  onDiscard: () => void
  onSave: () => void
}) {
  return (
    <div className="sticky bottom-4 z-40 flex flex-wrap items-center gap-x-4 gap-y-3 border border-primary bg-card p-3 shadow-[4px_4px_0px_var(--border)]">
      <span className="flex min-w-0 flex-1 items-center gap-2.5 text-sm">
        <StatusIndicator tone="brand" />
        <span className="text-foreground">
          {count} unsaved change{count === 1 ? "" : "s"}
          <span className="text-muted-foreground">
            {" "}
            across {domainCount} domain{domainCount === 1 ? "" : "s"}
          </span>
        </span>
      </span>
      <span className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          Discard
        </Button>
        <Button size="sm" onClick={onSave}>
          Save changes
        </Button>
      </span>
    </div>
  )
}

function DomainCard({
  domain,
  pendingPR,
  edits,
  onToggle,
}: {
  domain: DomainView
  pendingPR: PendingPRView | null
  edits: Record<string, boolean>
  onToggle: (type: ProxyableType, next: boolean) => void
}) {
  const meta = [
    domain.registered && `Registered ${domain.registered}`,
    domain.synced && `Last synced ${domain.synced}`,
  ].filter(Boolean)

  return (
    <section className="flex flex-col border border-border bg-card">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3">
        <span className="flex min-w-0 items-center gap-3">
          {domain.provider ? (
            <span
              className="flex size-8 shrink-0 items-center justify-center border border-border bg-background text-foreground"
              title={domain.provider.name}
            >
              <ProviderMark provider={domain.provider} />
            </span>
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center border border-border bg-background">
              <StatusIndicator tone={syncTone(domain.syncStatus)} />
            </span>
          )}
          <span className="flex min-w-0 flex-col">
            <a
              href={`https://${domain.fqdn}`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-mono text-sm font-semibold text-foreground no-underline hover:text-accent hover:underline"
            >
              {domain.fqdn}
            </a>
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <StatusIndicator
                tone={syncTone(domain.syncStatus)}
                className="size-1.5"
              />
              {syncLabel(domain.syncStatus)}
              {domain.provider ? ` · ${domain.provider.name}` : null}
            </span>
          </span>
        </span>

        <span className="flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1">
          {meta.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {meta.join(" · ")}
            </span>
          )}
          <a
            href={domain.recordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-accent no-underline hover:underline"
          >
            View record
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </span>
      </header>

      {pendingPR ? (
        <p className="m-0 flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          <GitPullRequest className="size-3.5 shrink-0" aria-hidden="true" />A
          proxy change is awaiting review in{" "}
          <a
            href={pendingPR.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            pull request #{pendingPR.number}
          </a>
          . Switches are locked until it lands.
        </p>
      ) : null}

      {domain.syncStatus === "failed" && domain.lastError ? (
        <p className="m-0 border-b border-destructive/30 bg-destructive/10 px-4 py-2 font-mono text-xs/relaxed text-destructive">
          {domain.lastError}
        </p>
      ) : null}

      <ul className="m-0 list-none p-0">
        {domain.records.map((row) => {
          const rowProvider = providerForRow(row)
          const key = row.proxy
            ? editKey(domain.subdomain, row.proxy.type)
            : null
          const staged = key !== null ? edits[key] : undefined
          const checked = staged ?? row.proxy?.proxied ?? false
          const dirty =
            row.proxy !== null &&
            staged !== undefined &&
            (staged !== row.proxy.proxied || row.proxy.mixed)

          return (
            <li
              key={row.type}
              className={cn(
                "flex min-h-12 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border/70 px-4 py-2.5 last:border-b-0",
                dirty && "bg-primary/5"
              )}
            >
              <Badge variant="secondary" className="w-16 justify-center">
                {row.type}
              </Badge>

              <span className="flex min-w-0 flex-1 items-center gap-2">
                {rowProvider ? (
                  <ProviderMark
                    provider={rowProvider}
                    className="size-3.5 shrink-0 text-muted-foreground"
                  />
                ) : null}
                <code className="min-w-0 flex-1 font-mono text-xs break-all text-foreground">
                  {row.value}
                </code>
              </span>

              {row.meta.map((item) => (
                <span
                  key={item}
                  className="font-mono text-[11px] text-muted-foreground"
                >
                  {item}
                </span>
              ))}

              {row.proxy ? (
                <ProxyCell
                  proxy={row.proxy}
                  checked={checked}
                  dirty={dirty}
                  disabled={
                    Boolean(row.proxy.lockedReason) || pendingPR !== null
                  }
                  fqdn={domain.fqdn}
                  onToggle={(next) => onToggle(row.proxy!.type, next)}
                />
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function ProxyCell({
  proxy,
  checked,
  dirty,
  disabled,
  fqdn,
  onToggle,
}: {
  proxy: NonNullable<DomainView["records"][number]["proxy"]>
  checked: boolean
  dirty: boolean
  disabled: boolean
  fqdn: string
  onToggle: (next: boolean) => void
}) {
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
          checked={checked}
          onCheckedChange={onToggle}
          disabled={disabled}
          aria-label={`${checked ? "Disable" : "Enable"} Cloudflare proxy for the ${proxy.type} record on ${fqdn}`}
          title={proxy.lockedReason ?? undefined}
        />
      </span>

      {dirty ? (
        <span className="text-[11px] font-medium text-primary">Unsaved</span>
      ) : null}

      {!dirty && proxy.mixed ? (
        <span className="text-[11px] text-warning">
          Entries disagree — toggling aligns all {proxy.type} records.
        </span>
      ) : null}

      {proxy.lockedReason ? (
        <span className="max-w-56 text-right text-[11px] text-muted-foreground">
          {proxy.lockedReason}
        </span>
      ) : null}
    </span>
  )
}
