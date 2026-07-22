import { cache } from "react"
import { headers } from "next/headers"
import { getPortfolioData } from "./github"
import { resolveSubdomain } from "./resolve"
import type { PortfolioData } from "./portfolio-data"
import type { TemplateName, PortfolioTheme } from "@/templates"

export interface RenderContext {
  login: string
  template: TemplateName
  theme?: PortfolioTheme
  data: PortfolioData
}

// Resolve the incoming request to a fully-loaded portfolio, or null.
//
// Production: proxy.ts sets `x-portfolio-subdomain` from the Host header. We
// resolve it against the domains repo; a subdomain that exists but has no
// portfolio block, or doesn't exist at all, yields null → 404.
//
// Local dev / apex (no subdomain header): fall back to PORTFOLIO_SPIKE_SUBDOMAIN
// or PORTFOLIO_SPIKE_LOGIN so the pipeline is runnable without wildcard DNS.
//
// Wrapped in React `cache` so generateMetadata and the page share a single
// resolve + GitHub fetch per request.
export const getRenderContext = cache(async (): Promise<RenderContext | null> => {
  const h = await headers()
  const subdomain =
    h.get("x-portfolio-subdomain") ??
    process.env.PORTFOLIO_SPIKE_SUBDOMAIN ??
    ""

  if (subdomain) {
    const resolved = await resolveSubdomain(subdomain)
    if (!resolved) return null
    const data = await getPortfolioData(resolved.github)
    if (!data) return null
    return {
      login: resolved.github,
      template: resolved.portfolio.template,
      theme: resolved.portfolio.theme,
      data,
    }
  }

  // No subdomain at all — dev/apex fallback so the renderer is demoable.
  const login = process.env.PORTFOLIO_SPIKE_LOGIN
  if (!login) return null
  const data = await getPortfolioData(login)
  if (!data) return null
  return { login, template: "terminal", data }
})
