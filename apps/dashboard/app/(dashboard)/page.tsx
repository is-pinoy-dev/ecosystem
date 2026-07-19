import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Separator } from "@is-pinoy-dev/ui/components/separator"
import { auth } from "@/auth"
import { DomainRows, NoDomains } from "@/components/domain-list"
import { PageHeader } from "@/components/page-header"
import { getSubdomainsForOwner } from "@/lib/domains"

export const metadata: Metadata = {
  title: "Overview",
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1.5 py-5 sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      <span className="text-4xl font-semibold tracking-[-0.03em] text-foreground">
        {value}
      </span>
    </div>
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

  const { login, name, email, image } = session.user
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

      <div className="grid border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-border max-sm:divide-y max-sm:divide-border">
        <Stat label="Your subdomains" value={owned.length} />
        <Stat label="DNS records" value={dnsRecords} />
        <Stat label="Registry total" value={registryTotal} />
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-14">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="m-0 text-lg font-semibold tracking-[-0.02em] text-foreground">
              Your subdomains
            </h2>
            {owned.length > 0 && (
              <Link
                href="/domains"
                className="flex items-center gap-1 text-[13px] font-medium text-accent no-underline hover:underline"
              >
                View records
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

        <aside className="flex min-w-0 flex-col gap-6 lg:border-l lg:border-border lg:pl-8">
          <section className="flex flex-col gap-3">
            <h2 className="m-0 font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Signed in as
            </h2>
            <div className="flex items-center gap-3">
              {image ? (
                <Image
                  src={image}
                  alt=""
                  width={40}
                  height={40}
                  className="size-10 shrink-0 border border-border"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center border border-border bg-secondary font-mono text-sm font-semibold text-secondary-foreground uppercase"
                >
                  {login.slice(0, 2)}
                </span>
              )}
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-foreground">
                  {name ?? login}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  @{login}
                </span>
              </div>
            </div>
            {email && (
              <p className="m-0 truncate text-xs text-muted-foreground">
                {email}
              </p>
            )}
            <Link
              href="/account"
              className="text-[13px] font-medium text-accent no-underline hover:underline"
            >
              Manage account
            </Link>
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <h2 className="m-0 font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Resources
            </h2>
            <ul className="m-0 flex list-none flex-col p-0">
              {RESOURCES.map((resource) => (
                <li key={resource.href}>
                  <a
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex min-h-11 items-center justify-between gap-3 border-b border-border py-2.5 no-underline"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[13px] font-medium text-foreground group-hover:text-accent">
                        {resource.label}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {resource.detail}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="size-3.5 shrink-0 text-muted-foreground group-hover:text-accent"
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="m-0 font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Grow your presence
            </h2>
            <p className="m-0 text-xs/relaxed text-muted-foreground">
              Subdomains are free for Filipino developers — one PR per domain.
            </p>
            <Button asChild variant="outline" size="sm" className="self-start">
              <a
                href="https://is-pinoy.dev/#claim"
                target="_blank"
                rel="noopener noreferrer"
              >
                Claim another subdomain
              </a>
            </Button>
          </section>
        </aside>
      </div>
    </div>
  )
}
