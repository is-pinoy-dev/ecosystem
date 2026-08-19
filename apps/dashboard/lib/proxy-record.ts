// Reading and rewriting a domains-repo record file: the `proxied` flag and
// the owner's contact email.
//
// Git stays the source of truth for both: the dashboard never writes to
// Cloudflare, and email is what a submission is ultimately addressed to. This
// reads the current flag out of the record JSON for display, and produces an
// edited copy of that JSON for a pull request. The sync workflow does the
// rest — `diff.ts` already emits an UPDATE when only `proxied` differs, so a
// merged flip propagates to Cloudflare with no registry changes.
//
// Platform feature flags and the hosted portfolio's style used to live here
// too, both PR-gated the same way `proxied` still is. They no longer are —
// both write straight to their D1 override instead (see
// lib/db/settings.ts) — so this file only ever handles `proxy` and
// `owner-email` changes now.
//
// Kept free of server-only imports so the shape handling can be unit tested;
// lib/proxy-pr.ts holds the GitHub I/O that consumes it.

import { domainSchema, type Domain } from "@is-pinoy-dev/schemas"
import { validateDomain } from "@is-pinoy-dev/validate"

import { providerForRecords } from "@/lib/providers"

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

/**
 * What the host at the other end of this record allows.
 *
 * Some providers cannot be proxied at all (GitHub Pages needs DNS-only to issue
 * its certificate; a pages.dev target across two Cloudflare accounts is rejected
 * with Error 1014), and our own portfolio renderer only works proxied. In those
 * cases the correct value is decided by the target, not the owner.
 *
 * `pinnedTo` is the value the provider requires, or null when it is the owner's
 * choice. A record already sitting at its pinned value has nothing to decide, so
 * the switch locks; a record sitting at the wrong value stays actionable so the
 * owner can correct it.
 */
export interface ProxyPolicy {
  pinnedTo: boolean | null
  note: string | null
}

export function proxyPolicy(
  records: Record<string, unknown>,
  type: ProxyableType
): ProxyPolicy {
  // Only a CNAME identifies a host; an A record points at a bare IP.
  if (type !== "CNAME") return { pinnedTo: null, note: null }

  const provider = providerForRecords(records)
  if (!provider) return { pinnedTo: null, note: null }

  if (provider.proxySupport === "forbidden") {
    return { pinnedTo: false, note: provider.note ?? null }
  }
  if (provider.proxySupport === "required") {
    return { pinnedTo: true, note: provider.note ?? null }
  }
  return { pinnedTo: null, note: null }
}

/**
 * Why this record's proxy setting cannot be changed, or null when it is free.
 * Locked only while the record already sits at the value its host requires.
 */
export function proxyLockReason(
  records: Record<string, unknown>,
  type: ProxyableType
): string | null {
  const policy = proxyPolicy(records, type)
  if (policy.pinnedTo === null) return null

  const state = readProxyState(records, type)
  const current = state?.proxied ?? false
  return current === policy.pinnedTo ? policy.note : null
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

/**
 * One pending edit: the master proxy switch on a record type, or the owner's
 * contact email. Both live in the same record file, so a batch of them
 * belongs in a single commit.
 */
export type RecordChange =
  | { kind: "proxy"; type: ProxyableType; enabled: boolean }
  | { kind: "owner-email"; email: string }

export type OwnerEmailChange = Extract<RecordChange, { kind: "owner-email" }>

/** The switch-shaped changes — the ones that read as on/off. */
type ToggleChange = Exclude<RecordChange, OwnerEmailChange>

function ownerEmailChangeOf(
  changes: RecordChange[]
): OwnerEmailChange | undefined {
  return changes
    .filter((c): c is OwnerEmailChange => c.kind === "owner-email")
    .at(-1)
}

/**
 * Apply every pending edit to a parsed record file and validate the result
 * against the same schema and rules the repo's CI check enforces, so the
 * dashboard never opens a pull request that would fail validation.
 *
 * Takes the changes as a batch because one subdomain can have its proxy switch
 * and its contact email edited before saving, and those belong in one commit.
 */
export function buildToggledFile(
  file: Record<string, unknown>,
  changes: RecordChange[]
): { content: string } | { error: string } {
  const records = file.records
  if (!records || typeof records !== "object") {
    return { error: "The record file has no records block." }
  }
  if (changes.length === 0) {
    return { error: "No changes to apply." }
  }

  const nextRecords = changes
    .filter((change) => change.kind === "proxy")
    .reduce(
      (acc, change) => setProxied(acc, change.type, change.enabled),
      records as Record<string, unknown>
    )

  const emailChange = ownerEmailChangeOf(changes)
  let nextOwner: Domain["owner"] | undefined
  if (emailChange) {
    const current = file.owner
    const base: Partial<Domain["owner"]> =
      current && typeof current === "object" && !Array.isArray(current)
        ? (current as Partial<Domain["owner"]>)
        : {}
    if (base.email === emailChange.email) {
      return { error: "That is already this subdomain's contact email." }
    }
    if (!base.github) {
      return { error: "The record file has no owner block." }
    }
    nextOwner = { ...base, github: base.github, email: emailChange.email }
  }

  const updated = {
    ...file,
    records: nextRecords,
    // Written in place: spreading `file` first keeps the block where it already
    // sits in the file, so the pull request diffs as one edited block.
    ...(nextOwner ? { owner: nextOwner } : {}),
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

/** Everything a pull request needs to describe one batch of changes. */
export interface ChangeSummary {
  title: string
  commitMessage: string
  /** Opening line of the pull request body. */
  lead: string
  /** One line per change, naming the field it writes. */
  bullets: string[]
}

function toggleBullet(change: ToggleChange): string {
  return `- \`records.${change.type}.proxied\` → \`${change.enabled}\``
}

function ownerEmailBullets(change: OwnerEmailChange): string[] {
  return [`- \`owner.email\` → \`${change.email}\``]
}

/**
 * Title, commit message, and body copy for a batch, written from what the batch
 * actually contains. All-on or all-off reads better as "enable"/"disable"; a
 * mix of those, or anything alongside the contact email, only honestly
 * summarises as "update".
 */
export function summarizeChanges(
  subdomain: string,
  changes: RecordChange[]
): ChangeSummary {
  const emailChange = ownerEmailChangeOf(changes)
  const toggles = changes.filter(
    (change): change is ToggleChange => change.kind !== "owner-email"
  )

  if (emailChange && toggles.length === 0) {
    return {
      title: `Update contact email: ${subdomain}`,
      commitMessage: `chore: update contact email for ${subdomain}`,
      lead: `Updates the contact email on file for \`${subdomain}.is-pinoy.dev\`.`,
      bullets: ownerEmailBullets(emailChange),
    }
  }

  const allOn = toggles.length > 0 && toggles.every((change) => change.enabled)
  const allOff =
    toggles.length > 0 && toggles.every((change) => !change.enabled)
  const action = emailChange
    ? "Update"
    : allOn
      ? "Enable"
      : allOff
        ? "Disable"
        : "Update"
  const subject = emailChange ? "settings" : "Cloudflare proxy"

  return {
    title: `${action} ${subject}: ${subdomain}`,
    commitMessage: `chore: ${action.toLowerCase()} ${subject} for ${subdomain}`,
    lead: `${action}s ${subject} for \`${subdomain}.is-pinoy.dev\`.`,
    bullets: [
      ...toggles.map(toggleBullet),
      ...(emailChange ? ownerEmailBullets(emailChange) : []),
    ],
  }
}
