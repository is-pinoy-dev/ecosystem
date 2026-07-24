import type { PortfolioConfig } from "@is-pinoy-dev/schemas"

// Portfolio subdomains are ordinary `subdomains/<name>.json` files in the
// is-pinoy-dev/domains repo whose CNAME points at portfolio.is-pinoy.dev and
// that carry a `portfolio` block. We resolve the label → { github, portfolio }
// straight from the git-tracked file, same cached-fetch approach the marketing
// site uses. A file with no `portfolio` block is a "points-at-your-own-host"
// subdomain and must not be rendered here.
const DOMAINS_REPO = "is-pinoy-dev/domains"
const REVALIDATE_SECONDS = 3600

interface DomainFile {
  owner: { github: string }
  portfolio?: PortfolioConfig
}

export interface ResolvedPortfolio {
  github: string
  portfolio: NonNullable<PortfolioConfig>
}

export async function resolveSubdomain(
  subdomain: string,
): Promise<ResolvedPortfolio | null> {
  const res = await fetch(
    `https://raw.githubusercontent.com/${DOMAINS_REPO}/main/subdomains/${subdomain}.json`,
    { next: { revalidate: REVALIDATE_SECONDS } },
  )
  if (!res.ok) return null

  let file: DomainFile
  try {
    file = (await res.json()) as DomainFile
  } catch {
    return null
  }

  if (!file.portfolio || !file.owner?.github) return null
  return { github: file.owner.github, portfolio: file.portfolio }
}
