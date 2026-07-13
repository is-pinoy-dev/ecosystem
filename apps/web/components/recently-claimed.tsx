import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"

async function fetchOperationalSubdomains(): Promise<string[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/is-pinoy-dev/domains/contents/subdomains",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return []
    const files = (await res.json()) as { name: string }[]
    return files
      .filter((file) => file.name.endsWith(".json"))
      .map((file) => file.name.replace(/\.json$/, ""))
      .slice(0, 5)
  } catch {
    return []
  }
}

export function RecentlyClaimedSkeleton() {
  return (
    <section className="border-b border-border py-6" aria-hidden="true">
      <Container>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-[9px] font-mono text-xs font-semibold tracking-[0.1em] text-accent uppercase">
            <StatusIndicator tone="brand" className="size-[7px]" />
            Recently claimed
          </div>
        </div>
        <div className="mt-[18px] flex items-center gap-5 sm:gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="h-3 w-24 shrink-0 animate-pulse bg-muted"
            />
          ))}
        </div>
      </Container>
    </section>
  )
}

export async function RecentlyClaimed() {
  const subdomains = await fetchOperationalSubdomains()

  return (
    <section
      className="border-b border-border py-6"
      aria-labelledby="recently-claimed-title"
    >
      <Container>
        <div className="flex items-center justify-between gap-4">
          <h2
            id="recently-claimed-title"
            className="m-0 flex items-center gap-[9px] font-mono text-xs font-semibold tracking-[0.1em] text-accent uppercase"
          >
            <StatusIndicator tone="brand" className="size-[7px]" />
            Recently claimed
          </h2>
          <Link
            href="/showcase"
            className="inline-flex shrink-0 items-center gap-1.5 text-[12px] font-semibold text-accent no-underline transition-colors duration-[140ms] hover:underline sm:text-[13px]"
          >
            View showcase
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

        {subdomains.length > 0 ? (
          <div
            className="mt-[18px] flex items-center gap-x-5 overflow-x-auto scroll-px-5 sm:gap-x-6"
            style={{ scrollPaddingInline: 20 }}
          >
            {subdomains.map((subdomain, i) => (
              <div key={subdomain} className="flex shrink-0 items-center gap-5 sm:gap-6">
                {i > 0 && (
                  <span className="h-6 w-px shrink-0 bg-border" aria-hidden="true" />
                )}
                <a
                  href={`https://${subdomain}.is-pinoy.dev`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 font-mono text-[13px] whitespace-nowrap text-foreground no-underline transition-colors duration-[140ms] hover:text-accent"
                >
                  <StatusIndicator tone="success" className="size-[7px]" />
                  {subdomain}.is-pinoy.dev
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="m-0 mt-[18px] text-[13px] text-muted-foreground">
            New community sites will appear here.
          </p>
        )}
      </Container>
    </section>
  )
}
