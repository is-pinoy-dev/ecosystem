// Reading and rewriting a domains-repo record file: the `proxied` flag, the
// opt-in tool flags, and the hosted portfolio's style.
//
// Git stays the source of truth: the dashboard never writes to Cloudflare. It
// reads the current flag out of the record JSON for display, and produces an
// edited copy of that JSON for a pull request. The sync workflow does the rest —
// `diff.ts` already emits an UPDATE when only `proxied` differs, so a merged
// flip propagates to Cloudflare with no registry changes. A portfolio-style
// edit needs even less: the block is inert to sync, and apps/portfolio reads it
// from git on the next request.
//
// Kept free of server-only imports so the shape handling can be unit tested;
// lib/proxy-pr.ts holds the GitHub I/O that consumes it.

import { domainSchema, type PortfolioConfig } from "@is-pinoy-dev/schemas"
import { validateDomain } from "@is-pinoy-dev/validate"

import { findFeature, setFeatureEnabled } from "@/lib/features"
import {
  effectiveTheme,
  sameStyle,
  type PortfolioStyle,
  type PortfolioTemplate,
  type PortfolioTheme,
} from "@/lib/portfolio-style"
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
 * One pending edit: the master proxy switch on a record type, one platform
 * tool's flag, or the hosted portfolio's style. All three live in the same
 * record file, so a batch of them belongs in a single commit.
 */
export type RecordChange =
  | { kind: "proxy"; type: ProxyableType; enabled: boolean }
  | { kind: "feature"; feature: string; enabled: boolean }
  | { kind: "portfolio"; template: PortfolioTemplate; theme?: PortfolioTheme }

export type PortfolioChange = Extract<RecordChange, { kind: "portfolio" }>

/** The switch-shaped changes — the ones that read as on/off. */
type ToggleChange = Exclude<RecordChange, PortfolioChange>

function portfolioChangeOf(
  changes: RecordChange[]
): PortfolioChange | undefined {
  // Last wins, matching how the same switch appearing twice is deduped upstream.
  return changes
    .filter((c): c is PortfolioChange => c.kind === "portfolio")
    .at(-1)
}

/**
 * Rewrite the portfolio block to a new style, preserving everything else on it
 * (`sections`, and any key a later schema version adds).
 *
 * `theme` is written only when the template will actually render with one, so
 * moving from a layout to a designer template drops the now-meaningless palette
 * rather than leaving it behind to confuse the next reader of the file.
 */
function setPortfolioStyle(
  current: Record<string, unknown>,
  change: PortfolioChange
): Record<string, unknown> {
  const { template: _template, theme: _theme, ...rest } = current
  const theme = effectiveTheme(change.template, change.theme)
  return {
    template: change.template,
    ...(theme ? { theme } : {}),
    ...rest,
  }
}

/**
 * Apply every pending edit to a parsed record file and validate the result
 * against the same schema and rules the repo's CI check enforces, so the
 * dashboard never opens a pull request that would fail validation.
 *
 * Takes the changes as a batch because one subdomain can have its proxy switch
 * and several tool flags edited before saving, and those belong in one commit.
 * A portfolio-style edit is its own panel and arrives on its own, but goes
 * through the same path — one record file, one validated rewrite.
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

  const featureChanges = changes.filter((change) => change.kind === "feature")

  const styleChange = portfolioChangeOf(changes)
  let nextPortfolio: NonNullable<PortfolioConfig> | undefined
  if (styleChange) {
    const current = file.portfolio
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return {
        error: "This subdomain is not a hosted portfolio, so it has no style.",
      }
    }
    if (sameStyle(current as unknown as PortfolioStyle, styleChange)) {
      return { error: "That is already this portfolio's style." }
    }
    // Shape-checked immediately below by domainSchema, which is what decides
    // whether the rewrite is legal — the cast only carries it that far.
    nextPortfolio = setPortfolioStyle(
      current as Record<string, unknown>,
      styleChange
    ) as NonNullable<PortfolioConfig>
  }

  const updated = {
    ...file,
    records: nextRecords,
    // Written in place: spreading `file` first keeps the block where it already
    // sits in the file, so the pull request diffs as one edited block.
    ...(nextPortfolio ? { portfolio: nextPortfolio } : {}),
    // Only introduce a features block when a feature was actually edited, so a
    // pure proxy change leaves the rest of the file byte-identical.
    ...(featureChanges.length > 0
      ? {
          features: featureChanges.reduce(
            (acc, change) => {
              const feature = findFeature(change.feature)
              return feature
                ? setFeatureEnabled(acc, feature, change.enabled)
                : acc
            },
            (file.features ?? undefined) as Record<string, unknown> | undefined
          ),
        }
      : {}),
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

function portfolioBullets(change: PortfolioChange): string[] {
  const theme = effectiveTheme(change.template, change.theme)
  return [
    `- \`portfolio.template\` → \`${change.template}\``,
    theme
      ? `- \`portfolio.theme\` → \`${theme}\``
      : "- `portfolio.theme` removed — this design brings its own palette",
  ]
}

function toggleBullet(change: ToggleChange): string {
  return change.kind === "proxy"
    ? `- \`records.${change.type}.proxied\` → \`${change.enabled}\``
    : `- \`features.${change.feature}\` → \`${change.enabled}\``
}

/**
 * Title, commit message, and body copy for a batch, written from what the batch
 * actually contains. All-on or all-off reads better as "enable"/"disable"; a
 * mix of those, or anything alongside a style change, only honestly summarises
 * as "update".
 */
export function summarizeChanges(
  subdomain: string,
  changes: RecordChange[]
): ChangeSummary {
  const style = portfolioChangeOf(changes)
  const toggles = changes.filter(
    (change): change is ToggleChange => change.kind !== "portfolio"
  )

  if (style && toggles.length === 0) {
    return {
      title: `Update portfolio style: ${subdomain}`,
      commitMessage: `chore: update portfolio style for ${subdomain}`,
      lead: `Updates the hosted portfolio style for \`${subdomain}.is-pinoy.dev\`.`,
      bullets: portfolioBullets(style),
    }
  }

  const allOn = toggles.length > 0 && toggles.every((change) => change.enabled)
  const allOff =
    toggles.length > 0 && toggles.every((change) => !change.enabled)
  const action = style
    ? "Update"
    : allOn
      ? "Enable"
      : allOff
        ? "Disable"
        : "Update"
  const subject = style
    ? "settings"
    : toggles.length === 1 && toggles[0]!.kind === "proxy"
      ? "Cloudflare proxy"
      : "platform settings"

  return {
    title: `${action} ${subject}: ${subdomain}`,
    commitMessage: `chore: ${action.toLowerCase()} ${subject} for ${subdomain}`,
    lead: `${action}s ${subject} for \`${subdomain}.is-pinoy.dev\`.`,
    bullets: [
      ...toggles.map(toggleBullet),
      ...(style ? portfolioBullets(style) : []),
    ],
  }
}
