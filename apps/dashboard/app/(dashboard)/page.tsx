import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"
import { auth } from "@/auth"
import { DomainRows, NoDomains } from "@/components/domain-list"
import { PageHeader } from "@/components/page-header"
import { getSubdomainsForOwner } from "@/lib/domains"

export const metadata: Metadata = {
  title: "Overview",
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card size="sm" className="py-4">
      <CardContent className="flex flex-col gap-1">
        <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          {label}
        </span>
        <span className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
          {value}
        </span>
      </CardContent>
    </Card>
  )
}

const RESOURCES = [
  { href: "https://is-pinoy.dev", label: "is-pinoy.dev", detail: "Public site and availability checker" },
  { href: "https://docs.is-pinoy.dev", label: "Documentation", detail: "Registration guide and provider setup" },
  { href: "https://github.com/is-pinoy-dev/domains", label: "Domains registry", detail: "Your records live here as JSON" },
]

export default async function OverviewPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { login, name } = session.user
  const { owned, registryTotal } = await getSubdomainsForOwner(login)
  const dnsRecords = owned.reduce(
    (sum, domain) => sum + Object.keys(domain.records).length,
    0,
  )

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="Overview"
        title={`Kumusta, ${name?.split(" ")[0] ?? login}!`}
        description="Here's the current state of your is-pinoy.dev registrations."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Your subdomains" value={owned.length} />
        <StatTile label="DNS records" value={dnsRecords} />
        <StatTile label="Registry total" value={registryTotal} />
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="m-0 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Your subdomains
          </h2>
          {owned.length > 0 && (
            <Link
              href="/domains"
              className="flex items-center gap-1 text-[13px] font-medium text-accent no-underline hover:underline"
            >
              View all
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
        {owned.length > 0 ? (
          <DomainRows domains={owned} />
        ) : (
          <NoDomains login={login} />
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="m-0 text-lg font-semibold tracking-[-0.02em] text-foreground">
          Resources
        </h2>
        <ul className="m-0 list-none border-t border-border p-0">
          {RESOURCES.map((resource) => (
            <li key={resource.href} className="border-b border-border">
              <a
                href={resource.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 no-underline"
              >
                <span className="text-sm font-medium text-accent hover:underline">
                  {resource.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {resource.detail}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
