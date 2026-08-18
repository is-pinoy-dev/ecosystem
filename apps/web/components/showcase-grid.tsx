import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"
import { ProgressLink } from "@/components/progress-link"
import { ShowcaseCardImage } from "@/components/showcase-card-image"
import {
  getRegisteredSubdomains,
  type RegisteredSubdomain,
} from "@/lib/subdomains"
import { getScreenshotManifest } from "@/lib/screenshot-manifest"
import { getCapturedSubdomains } from "@/lib/captured-subdomains"
import {
  previewStatusFor,
  type ShowcasePreviewStatus,
} from "@/lib/showcase-preview"
import { rotateWeekly, weekStart } from "@/lib/showcase-rotation"
import { showcaseKindLabel } from "@/lib/showcase-kind"
import { getShowcaseVisits } from "@/lib/visits"
import {
  formatVisitCount,
  visitSummaryLabel,
  type ShowcaseVisitSummary,
} from "@/lib/visit-count"

/**
 * Every preview slot is framed at the generated OG card's 1200x630. The image
 * inside is contained rather than cropped because the endpoint can also return
 * a 1440x900 stored capture or a portfolio's own differently sized OG image.
 * Those source dimensions remain authoritative on every showcase surface.
 */
const PREVIEW_FRAME = "aspect-[1200/630]"

// ─── Data ────────────────────────────────────────────────────────────────────

interface SubdomainEntry extends RegisteredSubdomain {
  screenshotStatus: ShowcasePreviewStatus
  screenshotKey: string | null
  screenshotUrl: string | null
  screenshotCapturedAt: string | null
  /**
   * The trailing-window visit total, or null when there is none to show —
   * which covers a subdomain that opted out of collection, one collected but
   * with no traffic yet, and a database we could not reach. A card treats all
   * three the same way: it says nothing about visits.
   */
  visits: ShowcaseVisitSummary | null
}

export type ShowcaseSort = "newest" | "visits"

async function fetchAllSubdomains(): Promise<SubdomainEntry[]> {
  // The registry remains the source of truth for entries and ownership. The
  // Worker manifest is read-only metadata and can never trigger a capture, and
  // the visit totals are read-only aggregates that can never add an entry —
  // both are joined onto the registry list rather than extending it.
  const [registered, screenshots, visits] = await Promise.all([
    getRegisteredSubdomains(),
    getScreenshotManifest(),
    getShowcaseVisits(),
  ])

  return registered.map((entry) => {
    const screenshot = screenshots.get(entry.subdomain)
    const seen = visits?.get(entry.subdomain) ?? null
    return {
      ...entry,
      screenshotStatus: previewStatusFor(screenshot),
      screenshotKey: screenshot?.screenshotKey ?? null,
      screenshotUrl: screenshot?.screenshotUrl ?? null,
      screenshotCapturedAt: screenshot?.screenshotCapturedAt ?? null,
      // A zero is dropped rather than drawn. The showcase is a shop window,
      // and "0 visits" under somebody's work reads as a verdict on it; the
      // owner sees the real zero, dated and in context, in their dashboard.
      visits: seen && seen.total > 0 ? seen : null,
    }
  })
}

/**
 * The entries there is a real capture of, or null when neither source could say.
 *
 * Two paths reach the same stored capture: the manifest, which hands us the URL
 * outright, and the og Worker's list, which is what the card images themselves
 * resolve through. Either one is proof, so a misconfigured secret on one path no
 * longer decides what the landing page shows. When neither could answer, null
 * says so — an empty list would claim, wrongly, that nothing has been captured.
 */
async function captured(
  entries: SubdomainEntry[]
): Promise<SubdomainEntry[] | null> {
  const names = await getCapturedSubdomains()
  const fromManifest = entries.filter((entry) => Boolean(entry.screenshotUrl))
  if (names === null) return fromManifest.length > 0 ? fromManifest : null

  return entries.filter(
    (entry) => Boolean(entry.screenshotUrl) || names.has(entry.subdomain)
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

/**
 * An owner's GitHub avatar, as it appears on every showcase surface.
 *
 * A plain `<img>` rather than `next/image`: these are third-party avatars for
 * every entry in the registry, and routing all of them through the optimizer
 * would put a per-request transform in front of a file GitHub already serves at
 * the right size.
 *
 * Always `lazy`, and never on the critical path. A card's own preview is the
 * image that matters, and the browser resolves lazy images already in the
 * viewport immediately anyway — so this costs the above-the-fold cards nothing
 * while keeping the long tail of avatars out of the initial request queue.
 * `width`/`height` state the source's real dimensions; the box itself is pinned
 * by the utility classes, so nothing moves once one arrives.
 */
function OwnerAvatar({ github }: { github: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://avatars.githubusercontent.com/${encodeURIComponent(github)}?size=32`}
      alt=""
      aria-hidden="true"
      width={32}
      height={32}
      loading="lazy"
      decoding="async"
      className="size-5 shrink-0 border border-border object-cover"
    />
  )
}

/**
 * The visit total as it appears on a card, or nothing at all.
 *
 * Plain text rather than a Badge, and muted rather than accented: a badge is an
 * emphasis, and this number belongs among the card's metadata — not as a score
 * the showcase is ranking anybody by.
 *
 * `showWindow` puts the span on the figure itself. A bare total reads as
 * all-time and a tooltip is no answer on a phone, so every surface has to say
 * the window somewhere — but the grid says it once above the cards instead,
 * because repeating it on a three-column card in a narrow window costs the kind
 * label its last few characters.
 */
function VisitCount({
  visits,
  showWindow = false,
}: {
  visits: ShowcaseVisitSummary | null
  showWindow?: boolean
}) {
  if (!visits) return null
  return (
    <span
      className="shrink-0 font-mono text-xs text-muted-foreground"
      title={visitSummaryLabel(visits)}
    >
      {formatVisitCount(visits.total)} visits
      {showWindow ? ` · ${visits.windowDays}d` : ""}
    </span>
  )
}

function ShowcaseCard({
  entry,
  loading,
}: {
  entry: SubdomainEntry
  loading: "eager" | "lazy"
}) {
  return (
    <a
      href={`https://${entry.subdomain}.is-pinoy.dev`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block no-underline"
    >
      <Card className="h-full overflow-hidden bg-card py-0 transition-colors duration-150 group-hover:border-accent/50">
        {/* Preview */}
        <div
          className={`relative ${PREVIEW_FRAME} overflow-hidden border-b border-border bg-muted`}
        >
          <ShowcaseCardImage
            screenshotUrl={entry.screenshotUrl}
            screenshotStatus={entry.screenshotStatus}
            subdomain={entry.subdomain}
            loading={loading}
          />
          <div className="absolute inset-0 bg-primary/0 transition-colors group-hover:bg-primary/5" />
        </div>

        <CardContent className="flex flex-col p-0">
          {/* Site info */}
          <div className="flex flex-col gap-1 px-4 pt-4 pb-3">
            <span className="truncate font-mono text-sm font-semibold text-foreground">
              {entry.subdomain}.is-pinoy.dev
            </span>
            {/* Visits ride this row rather than the owner strip below. Both
                rows are tight in a three-column grid on a narrow window, but
                only this one can afford it: a kind label is one of two short
                fixed phrases, while a handle can run to thirty-nine characters
                and is the credit on somebody's work — the wrong thing to spend
                on a statistic. */}
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate text-xs text-muted-foreground">
                {showcaseKindLabel(entry)}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <VisitCount visits={entry.visits} />
                <span className="text-sm text-accent">→</span>
              </div>
            </div>
          </div>

          {/* Owner strip */}
          <div className="mx-4 h-px bg-border/40" />
          <div className="flex items-center gap-2 px-4 py-2.5">
            <OwnerAvatar github={entry.owner.github} />
            <span className="truncate font-mono text-xs text-muted-foreground">
              @{entry.owner.github}
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="overflow-hidden border border-border bg-card">
      {/* Image area — slightly lighter than bg-card so the pulse is visible */}
      <Skeleton
        className={`${PREVIEW_FRAME} w-full border-b border-border bg-muted`}
      />
      <div className="flex flex-col p-0">
        <div className="flex flex-col gap-2 px-4 pt-4 pb-3">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-2 w-28" />
        </div>
        <div className="mx-4 h-px bg-border/40" />
        <div className="flex items-center gap-2 px-4 py-2.5">
          <Skeleton className="h-4 w-4 shrink-0" />
          <Skeleton className="h-2 w-16" />
        </div>
      </div>
    </div>
  )
}

export function ShowcaseGridSkeleton({ limit = 6 }: { limit?: number }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
        {Array.from({ length: limit }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// ─── Grid (async, streamed) ───────────────────────────────────────────────────

function sortShowcaseEntries(
  entries: SubdomainEntry[],
  sort: ShowcaseSort
): SubdomainEntry[] {
  return [...entries].sort((a, b) => {
    if (sort === "visits") {
      return (b.visits?.total ?? -1) - (a.visits?.total ?? -1)
    }

    const parsedA = a.createdOn ? Date.parse(a.createdOn) : Number.NaN
    const parsedB = b.createdOn ? Date.parse(b.createdOn) : Number.NaN
    const aCreated = Number.isNaN(parsedA) ? 0 : parsedA
    const bCreated = Number.isNaN(parsedB) ? 0 : parsedB
    return bCreated - aCreated
  })
}

function ShowcaseSortLinks({ sort }: { sort: ShowcaseSort }) {
  const linkClass =
    "-mb-px flex min-h-11 items-center border-b-2 px-3 text-sm font-medium no-underline transition-colors duration-[140ms] outline-none first:pl-0 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"

  return (
    <nav
      aria-label="Sort showcase"
      className="flex items-center gap-3 max-sm:w-full max-sm:justify-between"
    >
      <span className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
        Sort by
      </span>
      <div className="flex">
        <Link
          href="/showcase"
          aria-current={sort === "newest" ? "page" : undefined}
          className={`${linkClass} ${
            sort === "newest"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Newest
        </Link>
        <Link
          href="/showcase?sort=visits"
          aria-current={sort === "visits" ? "page" : undefined}
          className={`${linkClass} ${
            sort === "visits"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground"
          }`}
        >
          Most visited
        </Link>
      </div>
    </nav>
  )
}

export async function ShowcaseGrid({
  limit,
  sort = "newest",
}: {
  limit?: number
  sort?: ShowcaseSort
} = {}) {
  const all = await fetchAllSubdomains()
  const sorted = sortShowcaseEntries(all, sort)
  const entries = limit ? sorted.slice(0, limit) : sorted

  // The window the cards' figures cover, taken from a card rather than from the
  // constant so the note and the numbers under it cannot drift apart. Absent
  // when no card has a figure, which is when the note would be noise.
  const visitWindow = entries.find((entry) => entry.visits)?.visits ?? null

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-3 max-sm:pb-0">
          <span className="border border-border bg-muted px-3 py-1.5 font-mono text-xs font-medium text-muted-foreground">
            {entries.length} SITE{entries.length !== 1 ? "S" : ""}
          </span>
          {visitWindow ? (
            // Said once for the grid instead of on every card. A card here is a
            // third of a row and cannot spare the characters, and a total with no
            // window attached invites reading it as all-time.
            <span className="font-mono text-xs tracking-[0.12em] text-muted-foreground uppercase">
              Visits · last {visitWindow.windowDays} days
            </span>
          ) : null}
        </div>
        <ShowcaseSortLinks sort={sort} />
      </div>

      {entries.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
          {entries.map((entry, index) => (
            <ShowcaseCard
              key={entry.subdomain}
              entry={entry}
              loading={index < 3 ? "eager" : "lazy"}
            />
          ))}
        </div>
      ) : (
        <div className="border border-border bg-card p-16 text-center">
          <span className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
            No entries yet
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Landing highlights ──────────────────────────────────────────────────────

/** One feature and three supporting entries in the landing section. */
const HIGHLIGHT_COUNT = 4

/**
 * The rotation pool's running order, which only ever grows at the end.
 *
 * `getRegisteredSubdomains` sorts newest-first, which is what a list people
 * read wants but the wrong basis for a window that advances by index: every new
 * claim lands at position 0 and shifts every entry along behind it, so the
 * week's four sites would turn over the moment somebody registered rather than
 * on the calendar. Oldest-first gives each entry a position it keeps for good,
 * with the subdomain breaking ties so entries claimed in the same commit — and
 * entries whose date we never resolved, which sort last — still have one fixed
 * order rather than whatever the fetches happened to settle in.
 */
function rotationOrder(entries: SubdomainEntry[]): SubdomainEntry[] {
  const claimedAt = (entry: SubdomainEntry) => {
    const parsed = entry.createdOn ? Date.parse(entry.createdOn) : Number.NaN
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed
  }

  return [...entries].sort((a, b) => {
    const ta = claimedAt(a)
    const tb = claimedAt(b)
    // Compared rather than subtracted: both sides are Infinity for two entries
    // with no date, and Infinity - Infinity is NaN, which sorts nothing.
    if (ta !== tb) return ta < tb ? -1 : 1
    return a.subdomain.localeCompare(b.subdomain)
  })
}

/**
 * The entries in play for the week that opened at `boundary`.
 *
 * The window advances by index, so a pool that grows underneath it moves: one
 * claim landing on a Thursday changes how long the list is, which moves the
 * window's start, which changes the four sites on show — a turnover driven by a
 * registration rather than by the calendar. Settling the pool at the week
 * boundary is what makes "featured this week" name one fixed set of sites for
 * the whole week; anything claimed since joins on Monday, and shows up on the
 * landing page's recently-claimed row in the meantime.
 *
 * Entries whose claim date never resolved are kept rather than held back. We
 * cannot show they are new, and the cost of guessing wrong is somebody's site
 * sitting out a week it was entitled to.
 */
function claimedBefore(
  entries: SubdomainEntry[],
  boundary: Date
): SubdomainEntry[] {
  const settled = entries.filter((entry) => {
    const parsed = entry.createdOn ? Date.parse(entry.createdOn) : Number.NaN
    return Number.isNaN(parsed) || parsed < boundary.getTime()
  })
  // A registry where every entry is new is a new registry, not an empty one.
  return settled.length > 0 ? settled : entries
}

/**
 * The entries the landing section features this week.
 *
 * Two tiers, each rotated on its own: captured sites have first claim on the
 * slots, and any left over are filled from the rest of the registry, which the
 * cards present through the OG-preview endpoint. Rotating the tiers separately
 * is what keeps the section moving while the screenshot worker catches up. One
 * combined pool cannot do both jobs — it either freezes the whole section
 * whenever four or fewer sites have been photographed, or, once more have,
 * rotates uncaptured entries into the lead ahead of real captures.
 *
 * `capturedPool` is null when neither source could say which sites have been
 * photographed. That is a fact about our infrastructure rather than about the
 * community, so the rotation simply runs over the whole registry instead.
 */
function weeklyHighlights(
  entries: SubdomainEntry[],
  capturedPool: SubdomainEntry[] | null,
  now: Date
): SubdomainEntry[] {
  const ordered = rotationOrder(claimedBefore(entries, weekStart(now)))
  if (capturedPool === null) return rotateWeekly(ordered, HIGHLIGHT_COUNT, now)

  const isCaptured = new Set(capturedPool.map((entry) => entry.subdomain))
  const leading = rotateWeekly(
    ordered.filter((entry) => isCaptured.has(entry.subdomain)),
    HIGHLIGHT_COUNT,
    now
  )
  if (leading.length >= HIGHLIGHT_COUNT) return leading

  return [
    ...leading,
    ...rotateWeekly(
      ordered.filter((entry) => !isCaptured.has(entry.subdomain)),
      HIGHLIGHT_COUNT - leading.length,
      now
    ),
  ]
}

function HighlightMeta({
  entry,
  featured = false,
}: {
  entry: SubdomainEntry
  featured?: boolean
}) {
  const cta = (
    <span className="flex size-9 shrink-0 items-center justify-center border border-border text-accent transition-colors duration-[140ms] group-hover:border-accent group-hover:bg-secondary">
      <ArrowUpRight className="size-4" aria-hidden="true" />
      <span className="sr-only">View site</span>
    </span>
  )

  const identity = (
    <>
      <p
        className={`m-0 font-mono font-semibold text-foreground ${featured ? "text-lg sm:text-xl lg:text-2xl" : "text-sm"}`}
      >
        <span className="block break-words">{entry.subdomain}</span>
        <span className="block text-muted-foreground">.is-pinoy.dev</span>
      </p>
      <div className="mt-3 flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
        <OwnerAvatar github={entry.owner.github} />
        <span className="min-w-0 truncate font-mono">
          @{entry.owner.github}
        </span>
      </div>
    </>
  )

  const footer = (
    <div
      className={`flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground ${featured ? "" : "mt-4"}`}
    >
      <span>{showcaseKindLabel(entry)}</span>
      {entry.visits ? <span aria-hidden>·</span> : null}
      <VisitCount visits={entry.visits} showWindow />
    </div>
  )

  if (featured) {
    return (
      <div className="flex min-h-[180px] flex-col bg-card px-4 py-3.5 lg:min-h-0 lg:p-6">
        <div className="flex items-start justify-between gap-4">
          <p className="m-0 pt-1 font-mono text-[10px] font-semibold tracking-[0.12em] text-primary-dark uppercase">
            Featured this week
          </p>
          {cta}
        </div>
        <div className="flex flex-1 flex-col justify-center py-5 lg:py-6">
          {identity}
        </div>
        {footer}
      </div>
    )
  }

  return (
    <div className="flex min-h-[112px] items-start justify-between gap-4 bg-card px-4 py-3.5 lg:p-4">
      <div className="min-w-0 flex-1">
        {identity}
        {footer}
      </div>
      {cta}
    </div>
  )
}

function HighlightCard({
  entry,
  featured = false,
}: {
  entry: SubdomainEntry
  featured?: boolean
}) {
  return (
    <a
      href={`https://${entry.subdomain}.is-pinoy.dev`}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block border border-border bg-card no-underline transition-colors duration-[140ms] outline-none hover:border-accent/60 focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${featured ? "sm:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.7fr)]" : ""}`}
    >
      <div
        className={`relative ${PREVIEW_FRAME} overflow-hidden border-b border-border bg-muted ${featured ? "lg:self-start lg:border-r lg:border-b-0" : ""}`}
      >
        <ShowcaseCardImage
          screenshotUrl={entry.screenshotUrl}
          screenshotStatus={entry.screenshotStatus}
          subdomain={entry.subdomain}
          loading="eager"
        />
        <div className="pointer-events-none absolute inset-0 bg-primary/0 transition-colors duration-[140ms] group-hover:bg-primary/5" />
        {featured ? (
          <span className="absolute top-3 left-3 border border-primary-dark bg-primary px-2.5 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-primary-foreground uppercase">
            Featured
          </span>
        ) : null}
      </div>
      <HighlightMeta entry={entry} featured={featured} />
    </a>
  )
}

function HighlightCardSkeleton({ featured = false }: { featured?: boolean }) {
  return (
    <div
      className={`border border-border bg-card ${featured ? "sm:col-span-2 lg:col-span-3 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.7fr)]" : ""}`}
    >
      <Skeleton
        className={`${PREVIEW_FRAME} w-full border-b border-border bg-muted ${featured ? "lg:self-start lg:border-r lg:border-b-0" : ""}`}
      />
      {featured ? (
        <div className="flex min-h-[180px] flex-col bg-card px-4 py-3.5 lg:min-h-0 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <Skeleton className="mt-1 h-2 w-24" />
            <Skeleton className="size-9 shrink-0" />
          </div>
          <div className="flex flex-1 flex-col justify-center gap-2 py-5 lg:py-6">
            <Skeleton className="h-4 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-5" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <div className="border-t border-border/60 pt-3">
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
      ) : (
        <div className="flex min-h-[112px] items-start justify-between gap-4 bg-card px-4 py-3.5 lg:p-4">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-32" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-5" />
              <Skeleton className="h-2.5 w-20" />
            </div>
            <Skeleton className="mt-2 h-2.5 w-24" />
          </div>
          <Skeleton className="size-9 shrink-0" />
        </div>
      )}
    </div>
  )
}

/** One wide weekly feature with three supporting projects beneath it. */
const HIGHLIGHT_ROW = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"

export function ShowcaseHighlightsSkeleton() {
  return (
    <div className={HIGHLIGHT_ROW}>
      {Array.from({ length: HIGHLIGHT_COUNT }).map((_, i) => (
        <HighlightCardSkeleton key={i} featured={i === 0} />
      ))}
    </div>
  )
}

export async function ShowcaseHighlights() {
  // Captured sites lead the landing page, then the rest of the registry fills
  // any remaining slots through the OG-preview endpoint. This preserves a full
  // 1+3 showcase while still giving real captures first claim on a slot — and
  // both tiers turn over on the calendar, so a week with few captures is still
  // a week the section moves.
  const entries = await fetchAllSubdomains()
  const highlights = weeklyHighlights(
    entries,
    await captured(entries),
    new Date()
  )

  if (highlights.length === 0) {
    // Nothing registered and nothing captured yet are different situations, and
    // inviting the first claim is wrong copy for a registry that already has
    // entries waiting on the screenshot worker.
    const registered = entries.length > 0
    return (
      <div
        className={`flex ${PREVIEW_FRAME} items-center justify-center border border-border bg-card p-8 text-center`}
      >
        <div>
          <p className="m-0 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
            {registered ? "Previews on the way" : "No sites yet"}
          </p>
          {registered ? (
            <ProgressLink
              href="/showcase"
              className="mt-3 inline-block text-[13px] font-semibold text-accent no-underline hover:underline"
            >
              Browse the showcase →
            </ProgressLink>
          ) : (
            <a
              href="https://docs.is-pinoy.dev/guides"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-[13px] font-semibold text-accent no-underline hover:underline"
            >
              Claim the first subdomain →
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={HIGHLIGHT_ROW}>
      {highlights.map((entry) => (
        <HighlightCard
          key={entry.subdomain}
          entry={entry}
          featured={entry === highlights[0]}
        />
      ))}
    </div>
  )
}

export function ShowcaseCTA() {
  return (
    <div className="mt-12 flex items-center justify-between gap-6 border-t border-border pt-10 max-sm:flex-col max-sm:items-start">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-xs font-semibold tracking-[0.1em] text-foreground uppercase">
          Want to be featured?
        </span>
        <span className="font-sans text-[13px] leading-[1.7] text-muted-foreground">
          Register your free subdomain and join the community.
        </span>
      </div>
      <Button asChild className="shrink-0">
        <a
          href="https://github.com/is-pinoy-dev/domains"
          target="_blank"
          rel="noopener noreferrer"
        >
          Claim yours
        </a>
      </Button>
    </div>
  )
}
