"use client"

import { useMemo, useState, useTransition } from "react"
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  ChevronRight,
  CheckCircle2,
  Copy,
  GitPullRequest,
  Loader2,
  XCircle,
} from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@is-pinoy-dev/ui/components/collapsible"
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
  saveSettings,
  type SettingChangeInput,
  type SubdomainSaveResult,
} from "@/app/(dashboard)/domains/actions"
import { ProviderMark } from "@/components/provider-mark"
import { VisitsPanel } from "@/components/visits-panel"
import type { VisitsReport } from "@/lib/analytics"
import {
  providerForRow,
  type DomainView,
  type PendingPRView,
  type PlatformView,
  type ToolLinkView,
} from "@/lib/domain-view"

interface Props {
  domains: DomainView[]
  /** Open settings pull requests keyed by subdomain. */
  pending: Record<string, PendingPRView>
  /** Null when the analytics database is not configured for this deployment. */
  visits: VisitsReport | null
  /** Configured, but the totals could not be read — say so rather than hide. */
  visitsUnavailable?: boolean
  /** Detail pages already render the domain identity and primary actions. */
  detail?: boolean
}

/** Identity of one staged switch. */
function proxyKey(subdomain: string, type: string) {
  return `${subdomain}:proxy:${type}`
}
function featureKey(subdomain: string, feature: string) {
  return `${subdomain}:feature:${feature}`
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
 * The domains listing with staged platform settings.
 *
 * Toggling changes nothing but local state — no request is made until "Save
 * changes", which opens one pull request per edited subdomain after
 * confirmation. Git remains the source of truth, so while a pull request is open
 * that domain's switches are read-only and show what the pull request will apply.
 */
export function DomainsManager({
  domains,
  pending,
  visits,
  visitsUnavailable = false,
  detail = false,
}: Props) {
  const [edits, setEdits] = useState<Record<string, boolean>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [results, setResults] = useState<SubdomainSaveResult[] | null>(null)
  const [saving, startSaving] = useTransition()

  const setEdit = (key: string, value: boolean) =>
    setEdits((current) => ({ ...current, [key]: value }))

  // An edit only counts while it differs from what git says.
  const changes = useMemo<SettingChangeInput[]>(() => {
    const list: SettingChangeInput[] = []
    for (const domain of domains) {
      const platform = domain.platform
      if (!platform || pending[domain.subdomain]) continue

      const pKey = proxyKey(domain.subdomain, platform.type)
      const stagedProxy = edits[pKey]
      const proxyDirty =
        stagedProxy !== undefined &&
        !platform.lockedReason &&
        (stagedProxy !== platform.enabled || platform.mixed)
      if (proxyDirty) {
        list.push({
          kind: "proxy",
          subdomain: domain.subdomain,
          type: platform.type,
          enabled: stagedProxy,
        })
      }

      for (const feature of platform.features) {
        const fKey = featureKey(domain.subdomain, feature.id)
        const staged = edits[fKey]
        if (staged === undefined || staged === feature.enabled) continue
        list.push({
          kind: "feature",
          subdomain: domain.subdomain,
          feature: feature.id,
          enabled: staged,
        })
      }
    }
    return list
  }, [domains, edits, pending])

  const affected = useMemo(
    () => [...new Set(changes.map((c) => c.subdomain))],
    [changes]
  )

  function onSave() {
    setResults(null)
    startSaving(async () => {
      const result = await saveSettings(changes)
      setResults(result.results)
      // Clear the staged edits that landed; failures stay staged for retry.
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
            visits={visits}
            visitsUnavailable={visitsUnavailable}
            edits={edits}
            onSetEdit={setEdit}
            showIdentity={!detail}
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

/** Human label for one staged change, used in the confirmation list. */
function changeLabel(
  change: SettingChangeInput,
  domains: DomainView[]
): string {
  if (change.kind === "proxy") return "Platform"
  const domain = domains.find((d) => d.subdomain === change.subdomain)
  const feature = domain?.platform?.features.find(
    (f) => f.id === change.feature
  )
  return feature?.name ?? change.feature
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
  changes: SettingChangeInput[]
  domains: DomainView[]
  affected: string[]
  saving: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const proxyChanges = changes.filter((c) => c.kind === "proxy")
  const featureChanges = changes.filter((c) => c.kind === "feature")
  const hasProxy = proxyChanges.length > 0
  const hasFeature = featureChanges.length > 0
  const proxyDomainCount = new Set(proxyChanges.map((c) => c.subdomain)).size

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          Save {affected.length} setting{affected.length === 1 ? "" : "s"}?
        </DialogTitle>
        <DialogDescription>
          {hasFeature && !hasProxy
            ? "Feature switches apply immediately — no pull request needed."
            : !hasFeature && hasProxy
              ? <>
                  The platform proxy switch is a Cloudflare setting, so saving
                  opens{" "}
                  {proxyDomainCount === 1
                    ? "a pull request"
                    : `${proxyDomainCount} pull requests`}{" "}
                  against{" "}
                  <span className="font-mono text-foreground">
                    is-pinoy-dev/domains
                  </span>{" "}
                  on your behalf. Nothing changes until it is merged and the
                  next sync applies it.
                </>
              : <>
                  Feature switches apply immediately. The platform proxy
                  switch still opens{" "}
                  {proxyDomainCount === 1
                    ? "a pull request"
                    : `${proxyDomainCount} pull requests`}{" "}
                  against{" "}
                  <span className="font-mono text-foreground">
                    is-pinoy-dev/domains
                  </span>
                  , since Cloudflare only picks that up through the registry
                  sync.
                </>}
        </DialogDescription>
      </DialogHeader>

      <ul className="m-0 flex list-none flex-col gap-0 border border-border p-0">
        {changes.map((change) => {
          const domain = domains.find((d) => d.subdomain === change.subdomain)
          return (
            <li
              key={`${change.subdomain}:${change.kind}:${
                change.kind === "proxy" ? change.type : change.feature
              }`}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-3 py-2 text-xs last:border-b-0"
            >
              <Badge variant="secondary" className="justify-center">
                {changeLabel(change, domains)}
              </Badge>
              <span className="min-w-0 flex-1 truncate font-mono text-foreground">
                {domain?.fqdn ?? change.subdomain}
              </span>
              <span
                className={cn(
                  "font-mono font-medium",
                  change.enabled ? "text-success" : "text-warning"
                )}
              >
                {change.enabled ? "on" : "off"}
              </span>
            </li>
          )
        })}
      </ul>

      {hasProxy ? (
        <p className="m-0 flex items-start gap-2.5 border border-border bg-muted/40 p-3 text-xs/relaxed text-muted-foreground">
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <span>
            The proxy switch takes no effect until its pull request is merged
            and the next sync applies it — until then that domain keeps its
            current setting there, and its switch is read-only.
          </span>
        </p>
      ) : null}

      <DialogFooter>
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : hasProxy ? (
            <>
              <GitPullRequest aria-hidden="true" />
              Save settings
            </>
          ) : (
            <>
              <Check aria-hidden="true" />
              Save settings
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
  const succeeded = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)
  const prCount = succeeded.filter((r) => r.prUrl).length

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {succeeded.length > 0 ? "Settings saved" : "Nothing was saved"}
        </DialogTitle>
        <DialogDescription>
          {prCount > 0
            ? `Feature switches are live now. The proxy pull request${prCount === 1 ? "" : "s"} still need${prCount === 1 ? "s" : ""} a merge and a sync before that setting changes.`
            : succeeded.length > 0
              ? "All changes are live now."
              : "No setting was changed."}
        </DialogDescription>
      </DialogHeader>

      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {succeeded.map((result) => (
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
              {result.prUrl ? (
                <a
                  href={result.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  view pull request
                </a>
              ) : (
                "applied instantly"
              )}
              {result.prUrl && result.instant
                ? " — other changes applied instantly"
                : null}
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
  visits,
  visitsUnavailable,
  edits,
  onSetEdit,
  showIdentity,
}: {
  domain: DomainView
  pendingPR: PendingPRView | null
  visits: VisitsReport | null
  visitsUnavailable: boolean
  edits: Record<string, boolean>
  onSetEdit: (key: string, value: boolean) => void
  showIdentity: boolean
}) {
  const meta = [
    domain.registered && `Registered ${domain.registered}`,
    domain.synced && `Last synced ${domain.synced}`,
  ].filter(Boolean)

  return (
    <section className="flex flex-col border border-border bg-card">
      {showIdentity ? (
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3">
          <span className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-8 shrink-0 items-center justify-center border border-border bg-background text-foreground"
              title={domain.provider?.name}
            >
              {domain.provider ? (
                <ProviderMark provider={domain.provider} />
              ) : (
                <StatusIndicator tone={syncTone(domain.syncStatus)} />
              )}
            </span>
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
      ) : (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <span className="flex min-w-0 flex-col gap-0.5">
            <h2 className="m-0 text-sm font-semibold text-foreground">
              DNS records
            </h2>
            <span className="text-[11px] text-muted-foreground">
              The registry entries currently serving this address.
            </span>
          </span>
          <a
            href={domain.recordUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent no-underline hover:underline"
          >
            View source
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        </header>
      )}

      {pendingPR ? (
        <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 border-b border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          <GitPullRequest className="size-3.5 shrink-0" aria-hidden="true" />
          Settings for this domain are waiting in{" "}
          <a
            href={pendingPR.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline"
          >
            pull request #{pendingPR.number}
          </a>
          . They apply once it is merged — switches are read-only until then.
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
          return (
            <li
              key={row.type}
              className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/70 px-4 py-2 last:border-b-0"
            >
              <Badge variant="secondary" className="w-16 justify-center">
                {row.type}
              </Badge>
              <span className="flex min-w-0 flex-1 items-center gap-2 max-sm:basis-[calc(100%-5rem)]">
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
                  className="font-mono text-[11px] text-muted-foreground max-sm:ml-20"
                >
                  {item}
                </span>
              ))}
            </li>
          )
        })}
      </ul>

      {domain.platform ? (
        <PlatformPanel
          subdomain={domain.subdomain}
          platform={domain.platform}
          readOnly={pendingPR !== null}
          edits={edits}
          onSetEdit={onSetEdit}
        />
      ) : null}

      {/* Reads the saved switch states, not the staged ones: the numbers below
          describe traffic that has already been counted, so a switch flipped a
          moment ago has not changed them and must not relabel them. */}
      {domain.platform ? (
        <VisitsPanel
          visits={visits?.bySubdomain[domain.subdomain] ?? null}
          unavailable={visitsUnavailable}
          through={visits?.through ?? null}
          windowDays={visits?.windowDays ?? 0}
          proxied={domain.platform.enabled}
          enabled={
            domain.platform.features.find(
              (feature) => feature.id === "analytics"
            )?.enabled ?? false
          }
        />
      ) : null}
    </section>
  )
}

/**
 * Master switch plus the tools it gates. Tools cannot run on an unproxied
 * record, so they follow the master's staged value rather than its saved one —
 * turning the platform on and a tool on in the same save is a valid batch.
 */
function PlatformPanel({
  subdomain,
  platform,
  readOnly,
  edits,
  onSetEdit,
}: {
  subdomain: string
  platform: PlatformView
  readOnly: boolean
  edits: Record<string, boolean>
  onSetEdit: (key: string, value: boolean) => void
}) {
  const pKey = proxyKey(subdomain, platform.type)
  const stagedProxy = edits[pKey]
  const proxyOn = stagedProxy ?? platform.enabled
  const proxyDirty =
    stagedProxy !== undefined &&
    (stagedProxy !== platform.enabled || platform.mixed)
  const proxyLocked = Boolean(platform.lockedReason) || readOnly

  const dirtyCount =
    (proxyDirty ? 1 : 0) +
    platform.features.filter((feature) => {
      const staged = edits[featureKey(subdomain, feature.id)]
      return staged !== undefined && staged !== feature.enabled
    }).length

  // Null until the owner decides for themselves; until then the section opens
  // itself whenever there is unsaved work in it, so staged edits are never
  // hidden behind a collapsed header.
  const [userOpen, setUserOpen] = useState<boolean | null>(null)
  const open = userOpen ?? dirtyCount > 0

  // Summarise from the staged values, so a collapsed section still describes
  // what saving would produce rather than what git currently says.
  const activeNames = proxyOn
    ? [
        ...platform.features
          .filter(
            (feature) =>
              edits[featureKey(subdomain, feature.id)] ?? feature.enabled
          )
          .map((feature) => feature.name),
        ...platform.builtins.map((builtin) => builtin.name),
      ]
    : []

  return (
    <Collapsible
      open={open}
      onOpenChange={setUserOpen}
      className="flex flex-col gap-0 border-t border-border bg-muted/20"
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-4 gap-y-2 pr-4",
          proxyDirty && "bg-primary/5"
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-2.5 border-0 bg-transparent py-3 pl-4 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring focus-visible:outline-solid"
            aria-label={`${open ? "Collapse" : "Expand"} platform features for ${subdomain}.is-pinoy.dev`}
          >
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90"
              )}
              aria-hidden="true"
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                Platform features
                {dirtyCount > 0 ? (
                  <span className="text-[11px] font-medium text-primary">
                    {dirtyCount} unsaved
                  </span>
                ) : null}
              </span>
              <span className="truncate text-[11px]/relaxed text-muted-foreground">
                {open
                  ? (platform.lockedReason ??
                    platform.correctionNote ??
                    "Routes your domain through our edge so built-in tools can run at /_tools/. Visits to proxied domains are logged for platform metrics.")
                  : !proxyOn
                    ? "Off"
                    : activeNames.length > 0
                      ? activeNames.join(" · ")
                      : "On — no tools enabled"}
              </span>
            </span>
          </button>
        </CollapsibleTrigger>
        <Switch
          checked={proxyOn}
          onCheckedChange={(next) => onSetEdit(pKey, next)}
          disabled={proxyLocked}
          aria-label={`${proxyOn ? "Disable" : "Enable"} platform features for ${subdomain}.is-pinoy.dev`}
          title={platform.lockedReason ?? undefined}
        />
      </div>

      <CollapsibleContent>
        <ul className="m-0 list-none border-t border-border/70 p-0">
          {platform.features.map((feature) => {
            const fKey = featureKey(subdomain, feature.id)
            const staged = edits[fKey]
            const on = staged ?? feature.enabled
            const dirty = staged !== undefined && staged !== feature.enabled
            // Opt-in tools are meaningless unproxied; an opt-out like analytics
            // stays switchable so a preference can be set ahead of time, but
            // nothing is happening either way while the platform is off.
            const blocked = !proxyOn && !feature.optOut
            const dormant = !proxyOn && feature.optOut
            // A prerequisite outside the platform switch itself — currently
            // only Contact Form's verified-email requirement (see
            // lib/domain-view.ts's contactFormBlockReason). Disables the
            // switch the same way `blocked` does, but is reported with its
            // own explanation rather than the platform-off copy.
            const prerequisiteBlocked = feature.blockedReason !== null
            return (
              <li
                key={feature.id}
                className={cn(
                  "flex flex-col items-stretch gap-2 border-b border-border/70 px-4 py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:gap-x-4 sm:gap-y-1 sm:pl-8",
                  dirty && "bg-primary/5"
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex items-center gap-2 text-[13px] font-medium text-foreground">
                    {feature.name}
                    {dirty ? (
                      <span className="text-[11px] font-medium text-primary">
                        Unsaved
                      </span>
                    ) : null}
                  </span>
                  <span className="text-[11px]/relaxed text-muted-foreground">
                    {blocked
                      ? "Needs platform features switched on."
                      : dormant
                        ? "Nothing is collected while the platform is off — this is your preference for when it is on."
                        : prerequisiteBlocked
                          ? feature.blockedReason
                          : feature.description}
                  </span>
                </span>
                <span className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
                  <ToolLinks
                    links={feature.links}
                    toolAvailable={platform.enabled && feature.enabled}
                  />
                  <Switch
                    checked={on && !blocked}
                    onCheckedChange={(next) => onSetEdit(fKey, next)}
                    disabled={blocked || prerequisiteBlocked || readOnly}
                    aria-label={`${on ? "Disable" : "Enable"} ${feature.name} for ${subdomain}.is-pinoy.dev`}
                    title={
                      prerequisiteBlocked
                        ? (feature.blockedReason ?? undefined)
                        : undefined
                    }
                  />
                </span>
              </li>
            )
          })}

          {platform.builtins.map((builtin) => (
            <li
              key={builtin.id}
              className="flex flex-col gap-2 border-b border-border/70 px-4 py-2.5 last:border-b-0 sm:pr-4 sm:pl-8"
            >
              <span className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-x-4 sm:gap-y-1">
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-[13px] font-medium text-foreground">
                    {builtin.name}
                  </span>
                  <span className="text-[11px]/relaxed text-muted-foreground">
                    {!proxyOn
                      ? "Available once platform features are switched on."
                      : (builtin.automaticNote ?? builtin.description)}
                  </span>
                </span>
                <span className="flex flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
                  <ToolLinks
                    links={builtin.links}
                    toolAvailable={platform.enabled}
                  />
                  <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                    {proxyOn
                      ? builtin.automaticNote
                        ? "Applied"
                        : "Included"
                      : "Off"}
                  </span>
                </span>
              </span>

              {proxyOn && builtin.snippet ? (
                <CopyableSnippet
                  snippet={builtin.snippet}
                  url={builtin.url}
                  previewAvailable={platform.enabled}
                />
              ) : null}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ToolLinks({
  links,
  toolAvailable,
}: {
  links: ToolLinkView[]
  toolAvailable: boolean
}) {
  return links.map((link) => {
    if (link.kind === "tool" && !toolAvailable) {
      return (
        <Button
          key={link.url}
          variant="default"
          size="xs"
          disabled
          title="Available after this tool is live on the saved domain."
        >
          {link.label}
          <ArrowUpRight aria-hidden="true" />
        </Button>
      )
    }

    return (
      <Button
        key={link.url}
        asChild
        variant={link.kind === "tool" ? "default" : "outline"}
        size="xs"
      >
        <a href={link.url} target="_blank" rel="noopener noreferrer">
          {link.label}
          <ArrowUpRight aria-hidden="true" />
        </a>
      </Button>
    )
  })
}

/**
 * The meta tag an owner needs in order to use a built-in endpoint. Shown rather
 * than applied, because on a subdomain pointing at someone else's host we never
 * see the HTML — only the owner can add this.
 */
function CopyableSnippet({
  snippet,
  url,
  previewAvailable,
}: {
  snippet: string
  url?: string
  previewAvailable: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked (insecure context or denied permission) — the snippet
      // is on screen and selectable, so there is nothing to recover from.
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-2">
      <code className="min-w-0 flex-1 overflow-x-auto border border-border bg-background px-2 py-1 font-mono text-[11px] whitespace-pre text-muted-foreground">
        {snippet}
      </code>
      <Button variant="outline" size="xs" onClick={copy}>
        {copied ? (
          <>
            <Check aria-hidden="true" />
            Copied
          </>
        ) : (
          <>
            <Copy aria-hidden="true" />
            Copy
          </>
        )}
      </Button>
      {url && previewAvailable ? (
        <Button asChild variant="outline" size="xs">
          <a href={url} target="_blank" rel="noopener noreferrer">
            Preview image
            <ArrowUpRight aria-hidden="true" />
          </a>
        </Button>
      ) : url ? (
        <Button
          variant="outline"
          size="xs"
          disabled
          title="Available after the platform is live on the saved domain."
        >
          Preview image
          <ArrowUpRight aria-hidden="true" />
        </Button>
      ) : null}
    </span>
  )
}
