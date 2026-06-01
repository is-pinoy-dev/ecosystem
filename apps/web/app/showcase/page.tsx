import type { Metadata } from "next"
import { ScanlineOverlay } from "@/components/scanline-overlay"
import { TopMarquee } from "@/components/top-marquee"
import { MainNav } from "@/components/main-nav"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"
import { ShowcaseCardImage } from "@/components/showcase-card-image"

export const metadata: Metadata = {
  title: "Showcase",
  description:
    "Explore Filipino developer portfolios and projects built on is-pinoy.dev subdomains.",
  openGraph: {
    title: "Showcase | is-pinoy.dev",
    description:
      "Explore Filipino developer portfolios and projects built on is-pinoy.dev subdomains.",
  },
}

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

function ShowcaseCard({ entry }: { entry: SubdomainEntry }) {
  return (
    <a
      href={`https://${entry.subdomain}.is-pinoy.dev`}
      target="_blank"
      rel="noopener noreferrer"
      className="no-underline group block"
    >
      <Card className="h-full overflow-hidden border-[3px] border-card bg-background shadow-[5px_5px_0_#000] transition-all duration-100 group-hover:-translate-x-px group-hover:-translate-y-px group-hover:border-primary group-hover:shadow-[6px_6px_0_var(--color-primary-dark)]">
        {/* Preview image */}
        <div className="relative h-[160px] overflow-hidden border-b-2 border-border bg-card">
          <ShowcaseCardImage ogImage={entry.ogImage} subdomain={entry.subdomain} />
          <div className="absolute inset-0 bg-primary/0 transition-colors group-hover:bg-primary/5" />
        </div>

        <CardContent className="flex flex-col gap-1 p-4">
          <span className="truncate font-pixel text-[8px] leading-[1.8] tracking-[0.05em] text-primary">
            {entry.subdomain}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/60">
            .is-pinoy.dev
          </span>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-muted-foreground">
              @{entry.owner.github}
            </span>
            <span className="font-mono text-[14px] text-muted-foreground transition-colors group-hover:text-primary">
              →
            </span>
          </div>
        </CardContent>
      </Card>
    </a>
  )
}

export default async function ShowcasePage() {
  const entries = await fetchAllSubdomains()

  return (
    <>
      <ScanlineOverlay />
      <TopMarquee />
      <MainNav />

      <main className="flex min-h-screen flex-col">
        <section className="xs:px-3.5 flex flex-col items-center px-10 pt-[220px] pb-[80px] sm:px-5 sm:pt-[180px]">
          <div className="w-full max-w-[960px]">
            <div className="mb-16 h-[2px] bg-primary shadow-[0_2px_0_var(--color-primary-dark)]" />

            <div className="mb-12 flex flex-col gap-4">
              <h1
                className="m-0 font-pixel leading-[1.6] tracking-[0.1em] text-primary"
                style={{ fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)" }}
              >
                {"// SHOWCASE"}
              </h1>
              <p className="m-0 max-w-[480px] font-sans text-[15px] leading-[1.7] text-muted-foreground">
                Filipino developer portfolios and projects living on is-pinoy.dev.
              </p>
              <span className="self-start border-2 border-primary/30 bg-primary/10 px-3 py-1.5 font-pixel text-[7px] tracking-[0.1em] text-primary">
                {entries.length} SITE{entries.length !== 1 ? "S" : ""}
              </span>
            </div>

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
          </div>
        </section>

        <SiteFooter />
      </main>
    </>
  )
}
