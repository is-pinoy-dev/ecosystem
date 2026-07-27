// The shape the domains listing renders.
//
// Built on the server and handed to the client component as plain data, so all
// the registry interpretation — proxy state, the pinned-portfolio lock, provider
// matching, date formatting — happens once, server-side, and the interactive
// listing stays a dumb renderer of what it is given.

import type { RegistrySubdomain } from "@/lib/domains"
import {
  providerForRecords,
  providerForTarget,
  type Provider,
} from "@/lib/providers"
import {
  BUILTIN_FEATURES,
  isFeatureEnabled,
  TOGGLEABLE_FEATURES,
} from "@/lib/features"
import {
  PROXYABLE_TYPES,
  proxyLockReason,
  proxyPolicy,
  readProxyState,
  type ProxyableType,
} from "@/lib/proxy-record"

export interface RecordProxyView {
  type: ProxyableType
  proxied: boolean
  mixed: boolean
  /** Non-null when this record's proxy setting is pinned and cannot change. */
  lockedReason: string | null
}

export interface RecordRowView {
  /** Record type as written in the file, upper-cased for display. */
  type: string
  value: string
  /** Remaining flags shown as quiet metadata, e.g. `ttl=300`. */
  meta: string[]
  /** Null for record types Cloudflare cannot proxy. */
  proxy: RecordProxyView | null
}

/** One switchable platform feature as the settings panel renders it. */
export interface FeatureView {
  id: string
  name: string
  description: string
  docsUrl: string
  enabled: boolean
  /**
   * True when the feature is on by default and the switch turns it off. Those
   * stay usable while the platform switch is off, because switching them off is
   * still meaningful.
   */
  optOut: boolean
}

/** A feature that comes with the platform and has nothing to switch. */
export interface BuiltinView {
  id: string
  name: string
  description: string
  docsUrl: string
}

/**
 * The platform panel: one master proxy switch plus the tools it gates. The
 * master is the record's proxy flag — the tools cannot run unproxied, so the
 * panel presents them as dependants rather than as peers.
 */
export interface PlatformView {
  /** The record type carrying the master switch (CNAME preferred over A). */
  type: ProxyableType
  enabled: boolean
  mixed: boolean
  /** Non-null when the host decides this and the record already matches. */
  lockedReason: string | null
  /** Set when the host requires a specific value the record does not have. */
  correctionNote: string | null
  features: FeatureView[]
  builtins: BuiltinView[]
}

export interface DomainView {
  subdomain: string
  fqdn: string
  recordUrl: string
  syncStatus: RegistrySubdomain["syncStatus"]
  lastError: string | null
  /** Preformatted on the server so the client renders no locale-dependent text. */
  registered: string | null
  synced: string | null
  provider: Provider | null
  records: RecordRowView[]
  /** Null when the record has no proxyable record type at all. */
  platform: PlatformView | null
}

const DOMAINS_REPO_URL = "https://github.com/is-pinoy-dev/domains"

export function recordFileUrl(subdomain: string) {
  return `${DOMAINS_REPO_URL}/blob/main/subdomains/${subdomain}.json`
}

/**
 * Registry record entries are either bare strings or objects shaped like
 * `{ value, proxied?, provider?, ... }`. Show the DNS value prominently and the
 * remaining flags as quiet metadata instead of raw JSON.
 */
export function parseRecordValue(value: unknown): {
  value: string
  meta: string[]
} {
  if (typeof value === "string") return { value, meta: [] }
  if (Array.isArray(value)) {
    const parsed = value.map(parseRecordValue)
    return {
      value: parsed.map((p) => p.value).join(", "),
      meta: [...new Set(parsed.flatMap((p) => p.meta))],
    }
  }
  if (value && typeof value === "object" && "value" in value) {
    const { value: dnsValue, ...rest } = value as Record<string, unknown>
    return {
      value: String(dnsValue),
      meta: Object.entries(rest).map(([k, v]) =>
        v === true ? k : `${k}=${String(v)}`
      ),
    }
  }
  return { value: JSON.stringify(value), meta: [] }
}

function formatDate(date: Date | null | undefined): string | null {
  if (!date) return null
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function toDomainView(domain: RegistrySubdomain): DomainView {
  const records: RecordRowView[] = Object.entries(domain.records).map(
    ([type, value]) => {
      const parsed = parseRecordValue(value)
      const state = readProxyState(domain.records, type)
      return {
        type: type.toUpperCase(),
        value: parsed.value,
        // The switch owns the proxied flag for A/CNAME, so drop it from the
        // quiet metadata rather than showing the same value twice.
        meta: state
          ? parsed.meta.filter((item) => !item.startsWith("proxied"))
          : parsed.meta,
        proxy: state
          ? {
              type: state.type,
              proxied: state.proxied,
              mixed: state.mixed,
              lockedReason: proxyLockReason(domain.records, state.type),
            }
          : null,
      }
    }
  )

  return {
    subdomain: domain.subdomain,
    fqdn: `${domain.subdomain}.is-pinoy.dev`,
    platform: toPlatformView(domain),
    recordUrl: recordFileUrl(domain.subdomain),
    syncStatus: domain.syncStatus,
    lastError: domain.lastError ?? null,
    registered: formatDate(domain.createdAt),
    synced: formatDate(domain.lastSyncedAt),
    provider: providerForRecords(domain.records),
    records,
  }
}

/** Provider for one record's own value — used for the per-row mark. */
export function providerForRow(row: RecordRowView): Provider | null {
  return row.type === "CNAME" ? providerForTarget(row.value) : null
}

/**
 * Build the platform panel. The master switch lives on the CNAME when there is
 * one — that is the record whose target decides whether proxying is even
 * allowed — and falls back to the A record otherwise.
 */
function toPlatformView(domain: RegistrySubdomain): PlatformView | null {
  const type = PROXYABLE_TYPES.find(
    (candidate) => readProxyState(domain.records, candidate) !== null
  )
  if (!type) return null

  const state = readProxyState(domain.records, type)
  if (!state) return null

  const policy = proxyPolicy(domain.records, type)
  const lockedReason = proxyLockReason(domain.records, type)

  return {
    type,
    enabled: state.proxied,
    mixed: state.mixed,
    lockedReason,
    // The host wants a value this record does not have — actionable, not locked.
    correctionNote:
      policy.pinnedTo !== null && lockedReason === null ? policy.note : null,
    features: TOGGLEABLE_FEATURES.map((feature) => ({
      id: feature.id,
      name: feature.name,
      description: feature.description,
      docsUrl: feature.docsUrl,
      enabled: isFeatureEnabled(domain.features, feature),
      optOut: feature.defaultEnabled,
    })),
    builtins: BUILTIN_FEATURES.map((feature) => ({
      id: feature.id,
      name: feature.name,
      description: feature.description,
      docsUrl: feature.docsUrl,
    })),
  }
}
