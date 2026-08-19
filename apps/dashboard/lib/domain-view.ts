// The shape the domains listing renders.
//
// Built on the server and handed to the client component as plain data, so all
// the registry interpretation — proxy state, the pinned-portfolio lock, provider
// matching, date formatting — happens once, server-side, and the interactive
// listing stays a dumb renderer of what it is given.

import type { DestinationAddressStatus } from "@/lib/cloudflare-email"
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

export interface ToolLinkView {
  label: string
  url: string
  /** Tool pages require the saved platform state; resources are always useful. */
  kind: "tool" | "resource"
}

/** One switchable platform feature as the settings panel renders it. */
export interface FeatureView {
  id: string
  name: string
  description: string
  docsUrl: string
  links: ToolLinkView[]
  enabled: boolean
  /**
   * True when the feature is on by default and the switch turns it off. Those
   * stay usable while the platform switch is off, because switching them off is
   * still meaningful.
   */
  optOut: boolean
  /**
   * Non-null when a prerequisite outside the platform switch keeps this
   * feature from being turned on — currently only Contact Form, gated on a
   * verified destination email (see components/contact-form-panel.tsx). The
   * switch renders disabled with this as its explanation.
   */
  blockedReason: string | null
}

/** A feature that comes with the platform and has nothing to switch. */
export interface BuiltinView {
  id: string
  name: string
  description: string
  docsUrl: string
  links: ToolLinkView[]
  /** Endpoint the owner can reference, when the feature exposes one. */
  url?: string
  /** A copyable line showing how to use it. */
  snippet?: string
  /** Set when we render the page and apply this for the owner already. */
  automaticNote?: string
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
  siteUrl: string
  recordUrl: string
  recordEditUrl: string
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

export interface PendingPRView {
  url: string
  number: number
}

/** The record that explains where browser traffic is routed. */
export function primaryRouteFor(
  domain: Pick<DomainView, "records">
): RecordRowView | undefined {
  return (
    domain.records.find((record) => record.type === "CNAME") ??
    domain.records.find((record) => record.type === "A") ??
    domain.records[0]
  )
}

const DOMAINS_REPO_URL = "https://github.com/is-pinoy-dev/domains"

export function recordFileUrl(subdomain: string) {
  return `${DOMAINS_REPO_URL}/blob/main/subdomains/${subdomain}.json`
}

export function recordEditUrl(subdomain: string) {
  return `${DOMAINS_REPO_URL}/edit/main/subdomains/${subdomain}.json`
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

export interface DomainViewOptions {
  /**
   * Verification status of the signed-in owner's Contact Form email (stored
   * account-wide in the `contact_emails` D1 table, see lib/contact-email.ts
   * — never a per-record git field) as a Cloudflare Email Routing
   * destination, for gating the Contact Form switch. Omitted (rather than
   * checked and found "absent") whenever the caller has not resolved it —
   * the listing page, or a deployment with Cloudflare Email Routing
   * unconfigured — and is treated the same as "not verified": there is no
   * confirmed place to deliver mail, so the switch stays disabled either way.
   */
  contactFormEmailStatus?: DestinationAddressStatus
  /**
   * The `contact-form` release flag (see lib/flags.ts) — separate from the
   * email-verification gate above. This one hides the feature from the
   * platform panel entirely, for rolling it out gradually or turning it off
   * without a deploy while its Cloudflare Email Routing/Turnstile
   * prerequisites are still being set up. Defaults to off, same as every
   * other release flag here, so a caller that forgets to resolve it hides
   * the feature rather than exposing an unlaunched one.
   */
  contactFormFlagEnabled?: boolean
}

export function toDomainView(
  domain: RegistrySubdomain,
  options: DomainViewOptions = {}
): DomainView {
  const fqdn = `${domain.subdomain}.is-pinoy.dev`
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
    fqdn,
    siteUrl: `https://${fqdn}`,
    platform: toPlatformView(domain, options),
    recordUrl: recordFileUrl(domain.subdomain),
    recordEditUrl: recordEditUrl(domain.subdomain),
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
/**
 * Why the Contact Form switch cannot be turned on yet, or null when it can.
 * Anything short of a confirmed "verified" blocks it — including "pending"
 * and the unresolved/unconfigured case — because there is no other signal
 * that Cloudflare will actually deliver mail to this address yet. The email
 * itself is verified on the account-scoped /account page, not here — this
 * panel only reflects the status of that one shared address.
 */
function contactFormBlockReason(
  status: DestinationAddressStatus | undefined
): string | null {
  if (status === "verified") return null
  if (status === "pending") {
    return "Verification pending — check your inbox on your Account page, or use Recheck once you've confirmed it."
  }
  return "Verify your contact email on your Account page before turning this on."
}

function toPlatformView(
  domain: RegistrySubdomain,
  options: DomainViewOptions
): PlatformView | null {
  const type = PROXYABLE_TYPES.find(
    (candidate) => readProxyState(domain.records, candidate) !== null
  )
  if (!type) return null

  const state = readProxyState(domain.records, type)
  if (!state) return null

  const policy = proxyPolicy(domain.records, type)
  const lockedReason = proxyLockReason(domain.records, type)
  const fqdn = `${domain.subdomain}.is-pinoy.dev`

  return {
    type,
    enabled: state.proxied,
    mixed: state.mixed,
    lockedReason,
    // The host wants a value this record does not have — actionable, not locked.
    correctionNote:
      policy.pinnedTo !== null && lockedReason === null ? policy.note : null,
    features: TOGGLEABLE_FEATURES.filter(
      (feature) =>
        feature.id !== "contact-form" || options.contactFormFlagEnabled
    ).map((feature) => {
      const links: ToolLinkView[] =
        feature.id === "site-audit"
          ? [
              {
                label: "Open Site Audit",
                url: `https://${fqdn}/_tools/site-audit`,
                kind: "tool",
              },
              { label: "View docs", url: feature.docsUrl, kind: "resource" },
            ]
          : feature.id === "analytics"
            ? [
                {
                  label: "Privacy policy",
                  url: feature.docsUrl,
                  kind: "resource",
                },
              ]
            : [
                {
                  label: "View docs",
                  url: feature.docsUrl,
                  kind: "resource",
                },
              ]

      return {
        id: feature.id,
        name: feature.name,
        description: feature.description,
        docsUrl: feature.docsUrl,
        links,
        enabled: isFeatureEnabled(domain.features, feature),
        optOut: feature.defaultEnabled,
        blockedReason:
          feature.id === "contact-form"
            ? contactFormBlockReason(options.contactFormEmailStatus)
            : null,
      }
    }),
    builtins: BUILTIN_FEATURES.map((feature) => {
      if (feature.id !== "og") {
        return {
          id: feature.id,
          name: feature.name,
          description: feature.description,
          docsUrl: feature.docsUrl,
          links: [
            { label: "View docs", url: feature.docsUrl, kind: "resource" },
          ],
        }
      }
      const url = `https://${fqdn}/_tools/og/image`
      // A hosted portfolio is rendered by us, so its meta tag already points
      // here — there is nothing for the owner to copy.
      const hosted = providerForRecords(domain.records)?.id === "portfolio"
      return {
        id: feature.id,
        name: feature.name,
        description: feature.description,
        docsUrl: feature.docsUrl,
        links: [
          {
            label: "Open OG tool",
            url: `https://${fqdn}/_tools/og`,
            kind: "tool",
          },
          { label: "View docs", url: feature.docsUrl, kind: "resource" },
        ],
        url,
        snippet: hosted
          ? undefined
          : `<meta property="og:image" content="${url}" />`,
        automaticNote: hosted
          ? "Already used as this portfolio's share image — nothing to add."
          : undefined,
      }
    }),
  }
}
