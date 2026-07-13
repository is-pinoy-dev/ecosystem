import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { SubdomainStatus } from "@is-pinoy-dev/status"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Container } from "@is-pinoy-dev/ui/components/container"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"

async function fetchOperationalSubdomains(): Promise<string[]> {
  try {
    const res = await fetch(
      "https://status.is-pinoy.dev/api/statuses?overall=operational",
      { next: { revalidate: 300 } }
    )
    if (res.ok) {
      const rows = (await res.json()) as SubdomainStatus[]
      if (rows.length > 0) return rows.map((row) => row.subdomain).slice(0, 5)
    }
  } catch {
    // Fall through to the GitHub fallback.
  }

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

export async function SubdomainMarquee() {
  const subdomains = await fetchOperationalSubdomains()
  if (subdomains.length === 0) return null

  return (
    <section
      className="border-b border-border py-6"
      aria-label="Recently claimed subdomains"
    >
      <Container className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold tracking-[0.1em] text-accent uppercase">
          <StatusIndicator tone="brand" />
          Recently claimed
        </div>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-3 lg:justify-center">
          {subdomains.map((subdomain) => (
            <a
              key={subdomain}
              href={`https://${subdomain}.is-pinoy.dev`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-mono text-xs text-foreground no-underline transition-colors hover:text-accent"
            >
              <StatusIndicator tone="success" />
              {subdomain}.is-pinoy.dev
            </a>
          ))}
        </div>

        <Button asChild variant="link" className="shrink-0">
          <Link href="/showcase">
            View showcase
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </Container>
    </section>
  )
}
