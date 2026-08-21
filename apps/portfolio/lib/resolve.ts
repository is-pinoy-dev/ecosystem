import type { PortfolioConfig } from "@is-pinoy-dev/schemas"
import { logMiss, logUpstream, type MissReason } from "./diagnostics"
import { getPortfolioOverride } from "./portfolio-override"

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

/**
 * Resolution never returns a bare null: the four ways this fails are four
 * different operator problems — nobody claimed the name, someone claimed it as
 * a redirect to their own host rather than a portfolio, the file is malformed,
 * or GitHub refused us — and collapsing them into `null` is what made the first
 * production 404 undiagnosable.
 */
export type Resolution =
  | { ok: true; value: ResolvedPortfolio }
  | { ok: false; reason: MissReason }

export async function resolveSubdomain(subdomain: string): Promise<Resolution> {
  const url = `https://raw.githubusercontent.com/${DOMAINS_REPO}/main/subdomains/${subdomain}.json`
  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } })
  if (!res.ok) {
    // 404 is the ordinary "no such subdomain" and needs no upstream line. Any
    // other status means raw.githubusercontent.com refused the lookup, which is
    // an outage on our side of the story rather than an unclaimed name.
    if (res.status === 404) return { ok: false, reason: "unknown-subdomain" }
    logUpstream("registry", url, res)
    return { ok: false, reason: "registry-unreachable" }
  }

  let file: DomainFile
  try {
    file = (await res.json()) as DomainFile
  } catch {
    return { ok: false, reason: "registry-unreadable" }
  }

  if (!file.owner?.github) return { ok: false, reason: "registry-unreadable" }
  if (!file.portfolio) return { ok: false, reason: "no-portfolio-block" }

  // A dashboard-saved override wins over whatever the git file says — it is
  // never touched by the sync workflow, so it only exists once someone has
  // edited this from the dashboard instead of by pull request. Only the
  // style (template/theme) is overridable; `sections` and anything else on
  // the block always come from git.
  const override = await getPortfolioOverride(subdomain)
  const { template: _template, theme: _theme, ...rest } = file.portfolio
  const portfolio: NonNullable<PortfolioConfig> = override
    ? {
        template: override.template,
        ...(override.theme ? { theme: override.theme } : {}),
        ...rest,
      }
    : file.portfolio

  return {
    ok: true,
    value: { github: file.owner.github, portfolio },
  }
}

/**
 * Resolve, naming the dead end in the logs. Callers only need the happy value;
 * logging here rather than at the call site keeps it to one line per request,
 * since lib/context.ts memoizes this for the page and generateMetadata alike.
 */
export async function resolveOrLog(
  subdomain: string,
): Promise<ResolvedPortfolio | null> {
  const result = await resolveSubdomain(subdomain)
  if (result.ok) return result.value
  logMiss(result.reason, { subdomain })
  return null
}
