import type { Metadata } from "next"
import Image from "next/image"
import { ScanlineOverlay } from "@/components/scanline-overlay"
import { TopMarquee } from "@/components/top-marquee"
import { MainNav } from "@/components/main-nav"
import { SiteFooter } from "@/components/site-footer"
import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"

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
      const res = await fetch(
        `https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/${subdomain}.json`,
        { next: { revalidate: 3600 } }
      )
      if (!res.ok) return null
      return (await res.json()) as SubdomainEntry
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
      className="no-underline group"
    >
      <Card className="h-full border-[3px] border-card bg-background shadow-[5px_5px_0_#000] transition-all duration-100 group-hover:-translate-x-px group-hover:-translate-y-px group-hover:border-primary group-hover:shadow-[6px_6px_0_var(--color-primary-dark)]">
        <CardContent className="relative flex flex-col gap-4 p-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden border-2 border-border">
              <Image
                src={`https://github.com/${entry.owner.github}.png?size=80`}
                alt={`${entry.owner.github}'s avatar`}
                width={40}
                height={40}
                className="h-full w-full [image-rendering:pixelated]"
                unoptimized
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="truncate font-pixel text-[7px] leading-[1.6] tracking-[0.05em] text-foreground">
                {entry.subdomain}
              </span>
              <span className="truncate font-mono text-[11px] text-muted-foreground">
                @{entry.owner.github}
              </span>
            </div>
          </div>

          <div className="truncate border border-border bg-card/40 px-3 py-2 font-mono text-[10px] text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary">
            {entry.subdomain}.is-pinoy.dev
          </div>

          <span className="absolute right-4 bottom-4 font-mono text-[14px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
            →
          </span>
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
                Filipino developer portfolios and projects living on
                is-pinoy.dev.
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
