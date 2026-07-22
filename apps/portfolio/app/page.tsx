import { notFound } from "next/navigation"
import { getPortfolioData } from "@/lib/github"
import { resolveSubdomain } from "@/lib/resolve"
import { renderTemplate, type TemplateName, type PortfolioTheme } from "@/templates"

// One-hour ISR — freshness is pure revalidation (no webhook).
export const revalidate = 3600

// SPIKE ENTRY (Phase 2). A hardcoded/env-driven subdomain drives the full
// pipeline: resolve → fetch GitHub → sanitize README → pick template → render.
//
// In the real app this logic moves behind middleware that reads the subdomain
// from the Host header (see middleware.ts). For now:
//   1. Try to resolve PORTFOLIO_SPIKE_SUBDOMAIN against the domains repo.
//   2. If it has no portfolio block yet (nothing is deployed to production),
//      fall back to rendering PORTFOLIO_SPIKE_LOGIN with the terminal template
//      so the fetch → sanitize → render path is exercisable end-to-end today.
const SPIKE_SUBDOMAIN = process.env.PORTFOLIO_SPIKE_SUBDOMAIN ?? ""
const SPIKE_LOGIN = process.env.PORTFOLIO_SPIKE_LOGIN ?? "octocat"

export default async function PortfolioPage() {
  let login = SPIKE_LOGIN
  let template: TemplateName = "terminal"
  let theme: PortfolioTheme | undefined

  if (SPIKE_SUBDOMAIN) {
    const resolved = await resolveSubdomain(SPIKE_SUBDOMAIN)
    if (resolved) {
      login = resolved.github
      template = resolved.portfolio.template
      theme = resolved.portfolio.theme
    }
  }

  const data = await getPortfolioData(login)
  if (!data) notFound()

  return renderTemplate(template, { data, theme })
}
