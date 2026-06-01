import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"
import { ShowcaseCardImage } from "@/components/showcase-card-image"

// ─── Data ────────────────────────────────────────────────────────────────────

interface SubdomainEntry {
  subdomain: string
  owner: { github: string; email?: string }
  records: Record<string, unknown>
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
        "User-Agent": "is-pinoy.dev-showcase/1.0 (+https://is-pinoy.dev/showcase)",
      },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    const html = await res.text()
    const match =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ??
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i)
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

async function fetchAllSubdomains(): Promise<SubdomainEntry[]> {
  let names: string[] = []
  try {
    const res = await fetch(
      "https://api.github.com/repos/is-pinoy-dev/domains/contents/subdomains",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
      }
    )
    if (res.ok) {
      const files = (await res.json()) as { name: string }[]
      names = files
        .filter((f) => f.name.endsWith(".json"))
        .map((f) => f.name.replace(/\.json$/, ""))
    }
  } catch {
    // no-op
  }

  if (names.length === 0) return []

  const results = await Promise.allSettled(
    names.map(async (subdomain) => {
      const [jsonRes, ogImage] = await Promise.all([
        fetch(
          `https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/${subdomain}.json`,
          { next: { revalidate: 3600 } }
        ),
        fetchOgImage(subdomain),
      ])
      if (!jsonRes.ok) return null
      const data = (await jsonRes.json()) as Omit<SubdomainEntry, "ogImage">
      return { ...data, ogImage }
    })
  )

  return results
    .filter(
      (r): r is PromiseFulfilledResult<SubdomainEntry> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value)
    .sort((a, b) => a.subdomain.localeCompare(b.subdomain))
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function ShowcaseCard({ entry }: { entry: SubdomainEntry }) {
  return (
    <a
      href={`https://${entry.subdomain}.is-pinoy.dev`}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline group block"
    >
      <Card className="h-full overflow-hidden border-[3px] border-card bg-background shadow-[5px_5px_0_#000] transition-all duration-100 group-hover:-translate-x-px group-hover:-translate-y-px group-hover:border-primary group-hover:shadow-[6px_6px_0_var(--color-primary-dark)]">
        {/* Preview */}
        <div className="relative h-[180px] overflow-hidden border-b-2 border-border bg-card">
          <ShowcaseCardImage ogImage={entry.ogImage} subdomain={entry.subdomain} />
          <div className="absolute inset-0 bg-primary/0 transition-colors group-hover:bg-primary/5" />
        </div>

        <CardContent className="flex flex-col p-0">
          {/* Site info */}
          <div className="flex flex-col gap-1 px-4 pt-4 pb-3">
            <span className="truncate font-pixel text-[8px] leading-[1.8] tracking-[0.05em] text-primary">
              {entry.subdomain}
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[10px] text-muted-foreground/60">
                .is-pinoy.dev
              </span>
              <span className="shrink-0 font-mono text-[13px] text-muted-foreground transition-colors group-hover:text-primary">
                →
              </span>
            </div>
          </div>

          {/* Owner strip */}
          <div className="mx-4 h-px bg-border/40" />
          <div className="flex items-center gap-2 px-4 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://github.com/${entry.owner.github}.png?size=32`}
              alt=""
              aria-hidden
              className="h-4 w-4 shrink-0 [image-rendering:pixelated]"
            />
            <span className="truncate font-mono text-[10px] text-muted-foreground">
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
    <div className="overflow-hidden border-[3px] border-card bg-background shadow-[5px_5px_0_#000]">
      {/* Image area — slightly lighter than bg-card so the pulse is visible */}
      <Skeleton className="h-[180px] w-full border-b-2 border-border bg-muted/30" />
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

export function ShowcaseGridSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-7 w-20" />
      <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// ─── Grid (async, streamed) ───────────────────────────────────────────────────

export async function ShowcaseGrid() {
  const entries = await fetchAllSubdomains()

  return (
    <div className="flex flex-col gap-8">
      <span className="self-start border-2 border-primary/30 bg-primary/10 px-3 py-1.5 font-pixel text-[7px] tracking-[0.1em] text-primary">
        {entries.length} SITE{entries.length !== 1 ? "S" : ""}
      </span>

      {entries.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
          {entries.map((entry) => (
            <ShowcaseCard key={entry.subdomain} entry={entry} />
          ))}
        </div>
      ) : (
        <div className="border-[3px] border-card bg-background p-16 text-center">
          <span className="font-pixel text-[8px] tracking-[0.1em] text-muted-foreground">
            NO ENTRIES YET
          </span>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-6 border-t-2 border-primary/20 pt-10 max-sm:flex-col max-sm:items-start">
        <div className="flex flex-col gap-1.5">
          <span className="font-pixel text-[7px] leading-[1.8] tracking-[0.1em] text-foreground">
            WANT TO BE FEATURED?
          </span>
          <span className="font-sans text-[13px] leading-[1.7] text-muted-foreground">
            Register your free subdomain and join the community.
          </span>
        </div>
        <Button asChild variant="default-shadow" className="shrink-0">
          <a
            href="https://github.com/is-pinoy-dev/domains"
            target="_blank"
            rel="noopener noreferrer"
          >
            CLAIM YOURS
          </a>
        </Button>
      </div>
    </div>
  )
}
