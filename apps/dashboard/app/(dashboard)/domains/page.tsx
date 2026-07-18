import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is-pinoy-dev/ui/components/card"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"
import { auth } from "@/auth"
import { domainFileUrl, NoDomains } from "@/components/domain-list"
import { PageHeader } from "@/components/page-header"
import { getSubdomainsForOwner, type RegistrySubdomain } from "@/lib/domains"

export const metadata: Metadata = {
  title: "Domains",
}

function formatRecordValue(value: unknown): string {
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value.map(formatRecordValue).join(", ")
  return JSON.stringify(value)
}

function DomainCard({ domain }: { domain: RegistrySubdomain }) {
  const entries = Object.entries(domain.records)

  return (
    <Card>
      <CardHeader className="border-b [.border-b]:pb-5">
        <CardTitle className="flex items-center gap-2.5 font-mono text-base font-semibold">
          <StatusIndicator tone="success" />
          <a
            href={`https://${domain.subdomain}.is-pinoy.dev`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-foreground no-underline hover:text-accent hover:underline"
          >
            {domain.subdomain}.is-pinoy.dev
          </a>
        </CardTitle>
        <CardDescription>
          Owned by <span className="font-mono">@{domain.owner.github}</span>
        </CardDescription>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <a
              href={domainFileUrl(domain.subdomain)}
              target="_blank"
              rel="noopener noreferrer"
            >
              View JSON
            </a>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="m-0 list-none p-0">
          {entries.map(([type, value]) => (
            <li
              key={type}
              className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border py-2.5 last:border-b-0"
            >
              <Badge variant="secondary" className="w-16 justify-center">
                {type.toUpperCase()}
              </Badge>
              <code className="min-w-0 flex-1 font-mono text-xs break-all text-foreground">
                {formatRecordValue(value)}
              </code>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default async function DomainsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { login } = session.user
  const { owned } = await getSubdomainsForOwner(login)

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Registry"
        title="Your domains"
        description="DNS records registered to your GitHub account. To change a record, edit its JSON file in the domains repository."
      />

      {owned.length > 0 ? (
        <div className="flex flex-col gap-6">
          {owned.map((domain) => (
            <DomainCard key={domain.subdomain} domain={domain} />
          ))}
        </div>
      ) : (
        <NoDomains login={login} />
      )}
    </div>
  )
}
