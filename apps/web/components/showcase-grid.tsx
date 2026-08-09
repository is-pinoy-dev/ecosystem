import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"
import { ShowcaseCardImage } from "@/components/showcase-card-image"
import {
  getRegisteredSubdomains,
  type RegisteredSubdomain,
} from "@/lib/subdomains"
import { getScreenshotManifest } from "@/lib/screenshot-manifest"
import {
  previewStatusFor,
  type ShowcasePreviewStatus,
} from "@/lib/showcase-preview"

/**
 * Every preview is framed at the OG card's 1200x630. The showcase grid and the
 * landing section render the same images from the same endpoint, so they crop
 * them the same way — a preview must not change shape depending on which page
 * it is seen on.
 */
const PREVIEW_FRAME = "aspect-[1200/630]"

// ─── Data ────────────────────────────────────────────────────────────────────

interface SubdomainEntry extends RegisteredSubdomain {
  screenshotStatus: ShowcasePreviewStatus
  screenshotKey: string | null
  screenshotUrl: string | null
  screenshotCapturedAt: string | null
}

async function fetchAllSubdomains(limit?: number): Promise<SubdomainEntry[]> {
  // The registry remains the source of truth for entries and ownership. The
  // Worker manifest is read-only metadata and can never trigger a capture.
  const [registered, screenshots] = await Promise.all([
    getRegisteredSubdomains(),
    getScreenshotManifest(),
  ])
  const entries = limit ? registered.slice(0, limit) : registered
  if (entries.length === 0) return []

  return entries.map((entry) => {
    const screenshot = screenshots.get(entry.subdomain)
    return {
      ...entry,
      screenshotStatus: previewStatusFor(screenshot),
      screenshotKey: screenshot?.screenshotKey ?? null,
      screenshotUrl: screenshot?.screenshotUrl ?? null,
      screenshotCapturedAt: screenshot?.screenshotCapturedAt ?? null,
    }
  })
}

// ─── Card ─────────────────────────────────────────────────────────────────────

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
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs text-muted-foreground">
                Portfolio
              </span>
              <span className="shrink-0 text-sm text-accent">→</span>
            </div>
          </div>

          {/* Owner strip */}
          <div className="mx-4 h-px bg-border/40" />
          <div className="flex items-center gap-2 px-4 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://avatars.githubusercontent.com/${entry.owner.github}?size=32`}
              alt=""
              aria-hidden
              className="h-5 w-5 shrink-0 border border-border object-cover"
            />
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

export async function ShowcaseGrid({ limit }: { limit?: number } = {}) {
  const entries = await fetchAllSubdomains(limit)

  return (
    <div className="flex flex-col gap-8">
      <span className="self-start border border-border bg-muted px-3 py-1.5 font-mono text-xs font-medium text-muted-foreground">
        {entries.length} SITE{entries.length !== 1 ? "S" : ""}
      </span>

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

/** How many entries the landing section shows. */
const HIGHLIGHT_COUNT = 3

function HighlightMeta({ entry }: { entry: SubdomainEntry }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-card px-3.5 py-3">
      <div className="min-w-0">
        <p className="m-0 truncate font-mono text-[13px] font-semibold text-foreground">
          {entry.subdomain}.is-pinoy.dev
        </p>
        <p className="m-0 mt-[3px] truncate text-xs text-muted-foreground">
          Portfolio
        </p>
      </div>
      <span className="view-site shrink-0 text-xs font-semibold text-accent">
        View site →
      </span>
    </div>
  )
}

function HighlightCard({ entry }: { entry: SubdomainEntry }) {
  return (
    <a
      href={`https://${entry.subdomain}.is-pinoy.dev`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border border-border no-underline transition-colors duration-[140ms] hover:border-accent/60 [&:hover_.view-site]:underline"
    >
      <div
        className={`relative ${PREVIEW_FRAME} overflow-hidden border-b border-border bg-muted`}
      >
        <ShowcaseCardImage
          screenshotUrl={entry.screenshotUrl}
          screenshotStatus={entry.screenshotStatus}
          subdomain={entry.subdomain}
          loading="eager"
        />
      </div>
      <HighlightMeta entry={entry} />
    </a>
  )
}

function HighlightCardSkeleton() {
  return (
    <div className="border border-border">
      <Skeleton
        className={`${PREVIEW_FRAME} w-full border-b border-border bg-muted`}
      />
      <div className="flex items-center justify-between gap-3 bg-card px-3.5 py-3">
        <div className="flex min-w-0 flex-col gap-2">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
        <Skeleton className="h-2 w-14 shrink-0" />
      </div>
    </div>
  )
}

/** One row of equal cards, matching the showcase grid's own columns. */
const HIGHLIGHT_ROW = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6"

export function ShowcaseHighlightsSkeleton() {
  return (
    <div className={HIGHLIGHT_ROW}>
      {Array.from({ length: HIGHLIGHT_COUNT }).map((_, i) => (
        <HighlightCardSkeleton key={i} />
      ))}
    </div>
  )
}

export async function ShowcaseHighlights() {
  // Registry order, unmodified — the same entries the showcase grid leads with,
  // in the same sequence. Every card now resolves to a real preview through the
  // same ranked endpoint, so there is nothing left to reshuffle around: sorting
  // by which entries happened to have a stored capture only made the landing
  // page disagree with /showcase about what was newest.
  const highlights = await fetchAllSubdomains(HIGHLIGHT_COUNT)

  if (highlights.length === 0) {
    return (
      <div
        className={`flex ${PREVIEW_FRAME} items-center justify-center border border-border bg-card p-8 text-center`}
      >
        <div>
          <p className="m-0 font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
            No sites yet
          </p>
          <a
            href="https://docs.is-pinoy.dev/guides"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[13px] font-semibold text-accent no-underline hover:underline"
          >
            Claim the first subdomain →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className={HIGHLIGHT_ROW}>
      {highlights.map((entry) => (
        <HighlightCard key={entry.subdomain} entry={entry} />
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
