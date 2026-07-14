import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"

const ROW_COUNT = 3
const ROW_DURATIONS = ["46s", "38s", "52s"]

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
  } catch {
    return []
  }
}

function splitIntoRows(subdomains: string[]): string[][] {
  const rows: string[][] = Array.from({ length: ROW_COUNT }, () => [])
  subdomains.forEach((subdomain, i) => {
    rows[i % ROW_COUNT]!.push(subdomain)
  })
  return rows.filter((row) => row.length > 0)
}

function DomainChip({
  subdomain,
  decorative,
}: {
  subdomain: string
  decorative?: boolean
}) {
  return (
    <Badge
      asChild
      variant="outline"
      className="h-7 shrink-0 gap-1.5 border-border bg-background px-3 py-1 text-[13px] font-normal text-foreground [a]:hover:border-accent/60 [a]:hover:bg-background [a]:hover:text-accent"
    >
      <a
        href={`https://${subdomain}.is-pinoy.dev`}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={decorative ? -1 : undefined}
        aria-hidden={decorative || undefined}
        className="no-underline transition-colors duration-[140ms]"
      >
        <StatusIndicator tone="success" className="size-[7px]" />
        {subdomain}.is-pinoy.dev
      </a>
    </Badge>
  )
}

function MarqueeRow({
  domains,
  reverse,
  duration,
}: {
  domains: string[]
  reverse: boolean
  duration: string
}) {
  return (
    <div className="marquee-row">
      <div
        className={`marquee-track flex items-center gap-3 py-1 ${
          reverse ? "marquee-track--reverse" : ""
        }`}
        style={{ ["--marquee-duration" as string]: duration }}
      >
        {domains.map((subdomain) => (
          <DomainChip key={subdomain} subdomain={subdomain} />
        ))}
        {domains.map((subdomain) => (
          <DomainChip key={`dup-${subdomain}`} subdomain={subdomain} decorative />
        ))}
      </div>
    </div>
  )
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
        <div className="mt-[18px] flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              {Array.from({ length: 5 }).map((_, j) => (
                <span
                  key={j}
                  className="h-7 w-28 shrink-0 animate-pulse border border-border bg-muted"
                />
              ))}
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

export async function RecentlyClaimed() {
  const subdomains = await fetchOperationalSubdomains()
  const rows = splitIntoRows(subdomains)

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

        {rows.length > 0 ? (
          <div className="mt-[18px] flex flex-col gap-3">
            {rows.map((row, i) => (
              <MarqueeRow
                key={i}
                domains={row}
                reverse={i % 2 === 1}
                duration={ROW_DURATIONS[i % ROW_DURATIONS.length]!}
              />
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
