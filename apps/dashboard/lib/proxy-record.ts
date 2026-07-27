// Reading and rewriting the `proxied` flag inside a domains-repo record file.
//
// Git stays the source of truth: the dashboard never writes to Cloudflare. It
// reads the current flag out of the record JSON for display, and produces an
// edited copy of that JSON for a pull request. The sync workflow does the rest —
// `diff.ts` already emits an UPDATE when only `proxied` differs, so a merged
// flip propagates to Cloudflare with no registry changes.
//
// Kept free of server-only imports so the shape handling can be unit tested;
// lib/proxy-pr.ts holds the GitHub I/O that consumes it.

import { domainSchema } from "@is-pinoy-dev/schemas"
import { validateDomain } from "@is-pinoy-dev/validate"

/**
 * Cloudflare can only proxy the record types that carry an orange cloud, and
 * the schema mirrors that: `proxied` exists on A and CNAME records only. TXT
 * has no such field, so those rows render without a switch.
 */
export const PROXYABLE_TYPES = ["A", "CNAME"] as const
export type ProxyableType = (typeof PROXYABLE_TYPES)[number]

export function isProxyableType(type: string): type is ProxyableType {
  return (PROXYABLE_TYPES as readonly string[]).includes(type)
}

export interface ProxyState {
  type: ProxyableType
  /** True when every entry of this type is proxied. */
  proxied: boolean
  /**
   * Entries of this type disagree. Legal but pathological — the switch renders
   * from `proxied` (false) and flipping it brings the whole type into line.
   */
  mixed: boolean
  /** How many entries of this type the record holds. */
  count: number
}

/** Entries are either a single record or an array of them (`singleOrArray`). */
function toList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [value]
}

/**
 * A record entry is normally `{ value, proxied?, ttl? }`, but a bare string is
 * accepted defensively — older hand-written files and the database read model
 * can both carry the shorthand form.
 */
function entryProxied(entry: unknown): boolean {
  if (entry && typeof entry === "object" && "proxied" in entry) {
    return (entry as { proxied?: unknown }).proxied === true
  }
  return false
}

/** Current proxy state for one record type, or null when it is not proxyable. */
export function readProxyState(
  records: Record<string, unknown>,
  type: string
): ProxyState | null {
  if (!isProxyableType(type)) return null

  const raw = records[type]
  if (raw === undefined || raw === null) return null

  const list = toList(raw)
  if (list.length === 0) return null

  const flags = list.map(entryProxied)
  const allOn = flags.every(Boolean)
  const allOff = flags.every((flag) => !flag)

  return {
    type,
    proxied: allOn,
    mixed: !allOn && !allOff,
    count: list.length,
  }
}

/** Every proxyable record type present on a record, in file order. */
export function readProxyStates(
  records: Record<string, unknown>
): ProxyState[] {
  return Object.keys(records)
    .map((type) => readProxyState(records, type))
    .filter((state): state is ProxyState => state !== null)
}

/**
 * Set `proxied` on every entry of one type, returning a new records object.
 * A bare-string entry is promoted to `{ value, proxied }` so the result always
 * satisfies the schema. The input is never mutated.
 */
export function setProxied(
  records: Record<string, unknown>,
  type: ProxyableType,
  proxied: boolean
): Record<string, unknown> {
  const raw = records[type]
  if (raw === undefined || raw === null) return { ...records }

  const apply = (entry: unknown): unknown => {
    if (typeof entry === "string") return { value: entry, proxied }
    if (entry && typeof entry === "object") {
      return { ...(entry as Record<string, unknown>), proxied }
    }
    return entry
  }

  return {
    ...records,
    [type]: Array.isArray(raw) ? raw.map(apply) : apply(raw),
  }
}

/** The DNS value of an entry, whatever shape it is written in. */
function entryValue(entry: unknown): string | null {
  if (typeof entry === "string") return entry
  if (entry && typeof entry === "object" && "value" in entry) {
    const value = (entry as { value?: unknown }).value
    if (typeof value === "string") return value
  }
  return null
}

/** CNAME target of a hosted portfolio, matched to detect the pinned case. */
export const PORTFOLIO_CNAME_TARGET = "portfolio.is-pinoy.dev"

/**
 * Why this record's proxy setting cannot be changed from the dashboard, or null
 * when it is free to toggle.
 *
 * Hosted portfolios are pinned: their CNAME points at portfolio.is-pinoy.dev and
 * the renderer is only reachable over Cloudflare's proxy, so un-proxying one
 * takes the site down. Detected from the CNAME target rather than the record's
 * `portfolio` block, because the database read model stores only `records` —
 * this way the lock holds in both the database and GitHub-fallback paths.
 * Those owners can still edit the JSON by hand.
 */
export function proxyLockReason(
  records: Record<string, unknown>,
  type: ProxyableType
): string | null {
  if (type !== "CNAME") return null

  const targets = toList(records.CNAME)
    .map(entryValue)
    .filter((value): value is string => value !== null)

  const pinned = targets.some(
    (target) =>
      target.replace(/\.$/, "").toLowerCase() === PORTFOLIO_CNAME_TARGET
  )

  return pinned
    ? "Hosted portfolios stay proxied — the renderer is served through Cloudflare."
    : null
}

/** Branch name for a subdomain's proxy change — one per subdomain, reused. */
export function proxyBranch(subdomain: string): string {
  return `proxy/${subdomain}`
}

/**
 * Parse a `login:proxy/<subdomain>` pull request head label back into its
 * subdomain, or null when the label is not one of ours.
 */
export function subdomainFromHeadLabel(
  label: string,
  login: string
): string | null {
  const prefix = `${login}:${proxyBranch("")}`
  if (!label.toLowerCase().startsWith(prefix.toLowerCase())) return null
  const subdomain = label.slice(prefix.length)
  return subdomain.length > 0 ? subdomain : null
}

/** One pending proxy edit: a record type and the value it should end up at. */
export interface ProxyChange {
  type: ProxyableType
  proxied: boolean
}

/**
 * Apply every pending proxy flip to a parsed record file and validate the result
 * against the same schema and rules the repo's CI check enforces, so the
 * dashboard never opens a pull request that would fail validation.
 *
 * Takes the changes as a batch because one subdomain can have both an A and a
 * CNAME record edited before saving, and those belong in a single commit.
 */
export function buildToggledFile(
  file: Record<string, unknown>,
  changes: ProxyChange[]
): { content: string } | { error: string } {
  const records = file.records
  if (!records || typeof records !== "object") {
    return { error: "The record file has no records block." }
  }
  if (changes.length === 0) {
    return { error: "No changes to apply." }
  }

  const updated = {
    ...file,
    records: changes.reduce(
      (acc, change) => setProxied(acc, change.type, change.proxied),
      records as Record<string, unknown>
    ),
  }

  const parsed = domainSchema.safeParse(updated)
  if (!parsed.success) {
    return {
      error: `Updated record is invalid: ${parsed.error.issues
        .map((i) => i.message)
        .join("; ")}`,
    }
  }

  const validation = validateDomain(updated)
  if (!validation.ok) {
    return { error: validation.errors[0] ?? "Updated record is invalid." }
  }

  return { content: JSON.stringify(updated, null, 2) + "\n" }
}
