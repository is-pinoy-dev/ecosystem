import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"
import { getRegisteredSubdomains } from "@/lib/subdomains"

const ROW_COUNT = 3
const ROW_DURATIONS = ["72s", "60s", "82s"]

// Show only the most recently registered sites. With ROW_COUNT rows and a
// round-robin split, 24 fills each of the 3 rows with 8 chips — enough motion
// without an ever-growing DOM as the registry scales.
const RECENTLY_CLAIMED_LIMIT = 24

interface ClaimedDomain {
  subdomain: string
  owner: string
}

async function fetchRecentlyClaimed(): Promise<ClaimedDomain[]> {
  // Single source of truth, already sorted newest-registered first, so this
  // section is genuinely "recently claimed" rather than alphabetical.
  const registered = await getRegisteredSubdomains()
  return registered
    .slice(0, RECENTLY_CLAIMED_LIMIT)
    .map((entry) => ({ subdomain: entry.subdomain, owner: entry.owner.github }))
}

function splitIntoRows(domains: ClaimedDomain[]): ClaimedDomain[][] {
  const rows: ClaimedDomain[][] = Array.from({ length: ROW_COUNT }, () => [])
  domains.forEach((domain, i) => {
    rows[i % ROW_COUNT]!.push(domain)
  })
  return rows.filter((row) => row.length > 0)
}

function DomainChip({
  subdomain,
  owner,
  decorative,
}: {
  subdomain: string
  owner: string
  decorative?: boolean
}) {
  return (
    <Badge
      asChild
      variant="outline"
      className="h-7 shrink-0 gap-1.5 border-border bg-background px-2 py-1 text-[13px] font-normal text-foreground [a]:hover:border-accent/60 [a]:hover:bg-background [a]:hover:text-accent"
    >
      <a
        href={`https://${subdomain}.is-pinoy.dev`}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={decorative ? -1 : undefined}
        aria-hidden={decorative || undefined}
        className="no-underline transition-colors duration-[140ms]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://avatars.githubusercontent.com/${owner}?size=32`}
          alt=""
          aria-hidden="true"
          className="size-[18px] shrink-0 border border-border object-cover"
        />
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
  domains: ClaimedDomain[]
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
        {domains.map((domain) => (
          <DomainChip
            key={domain.subdomain}
            subdomain={domain.subdomain}
            owner={domain.owner}
          />
        ))}
        {domains.map((domain) => (
          <DomainChip
            key={`dup-${domain.subdomain}`}
            subdomain={domain.subdomain}
            owner={domain.owner}
            decorative
          />
        ))}
      </div>
    </div>
  )
}

// Varied chip widths so each row reads like real domain chips rather than a
// uniform grid; enough total width to overflow the container and clip under
// the marquee edge fade, matching the loaded state.
const SKELETON_CHIP_WIDTHS = [
  "w-[132px]",
  "w-[168px]",
  "w-[112px]",
  "w-[148px]",
  "w-[96px]",
  "w-[160px]",
  "w-[120px]",
  "w-[144px]",
  "w-[104px]",
  "w-[156px]",
]

function SkeletonChip({ widthClass }: { widthClass: string }) {
  return (
    <div
      className={`flex h-7 shrink-0 items-center gap-1.5 border border-border bg-background px-2 ${widthClass}`}
    >
      <span className="size-[18px] shrink-0 animate-pulse bg-muted" />
      <span className="h-3 grow animate-pulse bg-muted" />
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
          <span className="h-4 w-[92px] shrink-0 animate-pulse bg-muted" />
        </div>
        <div className="mt-[18px] flex flex-col gap-3">
          {Array.from({ length: ROW_COUNT }).map((_, i) => (
            <div key={i} className="marquee-row flex items-center gap-3 py-1">
              {SKELETON_CHIP_WIDTHS.map((_, j) => (
                <SkeletonChip
                  key={j}
                  widthClass={
                    SKELETON_CHIP_WIDTHS[
                      (j + i * 3) % SKELETON_CHIP_WIDTHS.length
                    ]!
                  }
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
  const domains = await fetchRecentlyClaimed()
  const rows = splitIntoRows(domains)

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
