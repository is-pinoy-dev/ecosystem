import { ArrowUpRight } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is-pinoy-dev/ui/components/card"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"
import { recordTypes, type RegistrySubdomain } from "@/lib/domains"

const DOMAINS_REPO_URL = "https://github.com/is-pinoy-dev/domains"

export function domainFileUrl(subdomain: string) {
  return `${DOMAINS_REPO_URL}/blob/main/subdomains/${subdomain}.json`
}

/** Ruled-row list of registered subdomains — rows and rules, not card grids. */
export function DomainRows({ domains }: { domains: RegistrySubdomain[] }) {
  return (
    <ul className="m-0 list-none border-t border-border p-0">
      {domains.map((domain) => (
        <li
          key={domain.subdomain}
          className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border py-3"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <StatusIndicator tone="success" />
            <a
              href={`https://${domain.subdomain}.is-pinoy.dev`}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-mono text-sm font-medium text-foreground no-underline hover:text-accent hover:underline"
            >
              {domain.subdomain}.is-pinoy.dev
            </a>
          </span>
          <span className="flex flex-1 items-center justify-end gap-2">
            {recordTypes(domain.records).map((type) => (
              <Badge key={type} variant="outline">
                {type}
              </Badge>
            ))}
            <a
              href={domainFileUrl(domain.subdomain)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View ${domain.subdomain}.is-pinoy.dev record on GitHub`}
              className="flex size-8 items-center justify-center text-muted-foreground transition-colors duration-[140ms] hover:text-accent"
            >
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </a>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function NoDomains({ login }: { login: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          No subdomains yet
        </CardTitle>
        <CardDescription className="text-sm/relaxed">
          The registry has no records owned by{" "}
          <span className="font-mono">@{login}</span>. Claim your free
          .is-pinoy.dev subdomain by opening a pull request against the domains
          repository.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button asChild>
          <a
            href="https://is-pinoy.dev/#claim"
            target="_blank"
            rel="noopener noreferrer"
          >
            Claim a domain
          </a>
        </Button>
        <Button asChild variant="outline">
          <a
            href="https://docs.is-pinoy.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read the docs
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
