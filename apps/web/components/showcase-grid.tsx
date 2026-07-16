import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"
import { ShowcaseCardImage } from "@/components/showcase-card-image"
import { getRegisteredSubdomains, type RegisteredSubdomain } from "@/lib/subdomains"

// ─── Data ────────────────────────────────────────────────────────────────────

interface SubdomainEntry extends RegisteredSubdomain {
  ogImage: string | null
}

async function fetchOgImage(subdomain: string): Promise<string | null> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 5000)
  try {
    const baseUrl = `https://${subdomain}.is-pinoy.dev`
    const res = await fetch(baseUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "is-pinoy.dev-showcase/1.0 (+https://is-pinoy.dev/showcase)",
      },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const html = await res.text()
    const match =
      html.match(
        /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
      ) ??
      html.match(
        /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i
      )
    const raw = match?.[1]?.trim()
    if (!raw) return null
    try {
      return new URL(raw, baseUrl).href
    } catch {
      return null
    }
  } catch {
    return null
  } finally {
    clearTimeout(id)
  }
}

async function fetchAllSubdomains(limit?: number): Promise<SubdomainEntry[]> {
  // Single source of truth for the registered list (already sorted newest-first
  // by registration date). Slice before the OG-image fan-out so we only fetch
  // images for the entries we render.
  const registered = await getRegisteredSubdomains()
  const entries = limit ? registered.slice(0, limit) : registered
  if (entries.length === 0) return []

  // TODO: at large scale (100+ subdomains) the per-subdomain OG-image fetch
  // fan-out will make revalidation slow. Consider a pre-built JSON manifest
  // (generated in CI) that stores ogImage URLs so this page only needs one
  // fetch instead of N+1.
  const withImages = await Promise.all(
    entries.map(async (entry) => ({
      ...entry,
      ogImage: await fetchOgImage(entry.subdomain),
    }))
  )

  // Preserve the utility's chronological (newest-first) ordering.
  return withImages
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ShowcaseCard({ entry }: { entry: SubdomainEntry }) {
  return (
    <a
      href={`https://${entry.subdomain}.is-pinoy.dev`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block no-underline"
    >
      <Card className="h-full overflow-hidden bg-card py-0 transition-colors duration-150 group-hover:border-accent/50">
        {/* Preview */}
        <div className="relative h-[180px] overflow-hidden border-b border-border bg-muted">
          <ShowcaseCardImage
            ogImage={entry.ogImage}
            subdomain={entry.subdomain}
            owner={entry.owner.github}
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
      <Skeleton className="h-[180px] w-full border-b border-border bg-muted" />
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
          {entries.map((entry) => (
            <ShowcaseCard key={entry.subdomain} entry={entry} />
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

// ─── Landing highlights (asymmetric featured + secondary) ────────────────────

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

function HighlightCard({
  entry,
  previewClassName,
  featured,
}: {
  entry: SubdomainEntry
  previewClassName: string
  featured?: boolean
}) {
  return (
    <a
      href={`https://${entry.subdomain}.is-pinoy.dev`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border border-border no-underline transition-colors duration-[140ms] hover:border-accent/60 [&:hover_.view-site]:underline"
    >
      <div
        className={`relative overflow-hidden border-b border-border bg-muted ${previewClassName}`}
      >
        <ShowcaseCardImage
          ogImage={entry.ogImage}
          subdomain={entry.subdomain}
          owner={entry.owner.github}
          size={featured ? "lg" : "sm"}
        />
      </div>
      <HighlightMeta entry={entry} />
    </a>
  )
}

function HighlightCardSkeleton({
  previewClassName,
}: {
  previewClassName: string
}) {
  return (
    <div className="border border-border">
      <Skeleton className={`w-full border-b border-border bg-muted ${previewClassName}`} />
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

export function ShowcaseHighlightsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.18fr_0.92fr] lg:gap-6">
      <HighlightCardSkeleton previewClassName="aspect-video lg:aspect-auto lg:h-[300px]" />
      <div className="flex flex-col gap-4">
        <HighlightCardSkeleton previewClassName="aspect-video lg:aspect-auto lg:h-32" />
        <HighlightCardSkeleton previewClassName="aspect-video lg:aspect-auto lg:h-32" />
      </div>
    </div>
  )
}

export async function ShowcaseHighlights() {
  const entries = await fetchAllSubdomains()

  if (entries.length === 0) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.18fr_0.92fr] lg:gap-6">
        <div className="flex aspect-video items-center justify-center border border-border bg-card p-8 text-center lg:aspect-auto lg:h-[380px]">
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
        <div className="flex flex-col gap-4">
          <div className="aspect-video border border-border bg-card lg:aspect-auto lg:h-32" />
          <div className="aspect-video border border-border bg-card lg:aspect-auto lg:h-32" />
        </div>
      </div>
    )
  }

  // Prefer entries with a real OG image so the featured slot has the
  // strongest preview; secondary slots then favor a different owner so the
  // row doesn't visually repeat the featured site.
  const withImage = entries.filter((e) => e.ogImage)
  const withoutImage = entries.filter((e) => !e.ogImage)
  const ordered = [...withImage, ...withoutImage]
  const featured = ordered[0]!
  const secondary = ordered
    .slice(1)
    .filter((e) => e.owner.github !== featured.owner.github)
  const fallbackSecondary = ordered.slice(1)
  const pool = secondary.length >= 2 ? secondary : fallbackSecondary
  const secondaryEntries = pool.slice(0, 2)

  return (
    <div className="grid gap-4 lg:grid-cols-[1.18fr_0.92fr] lg:gap-6">
      <HighlightCard
        entry={featured}
        previewClassName="aspect-video lg:aspect-auto lg:h-[300px]"
        featured
      />
      {secondaryEntries.length > 0 && (
        <div className="flex flex-col gap-4">
          {secondaryEntries.map((entry) => (
            <HighlightCard
              key={entry.subdomain}
              entry={entry}
              previewClassName="aspect-video lg:aspect-auto lg:h-32"
            />
          ))}
        </div>
      )}
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
