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
  /**
   * The subdomain this was served from, when there is one. Null for a preview
   * or the dev/apex fallback — those render on a host whose `/_tools/og/image`
   * would resolve to a different record than the one being displayed.
   */
  subdomain: string | null
}

export interface PreviewParams {
  login: string
  template: TemplateName
  theme?: PortfolioTheme
}

const TEMPLATES: TemplateName[] = [
  "terminal",
  "pixel-card",
  "minimal",
  "concrete",
  "broadsheet",
  "phosphor",
  "draft",
  "bubblegum",
  "grid",
]
const THEMES: PortfolioTheme[] = [
  "gold-dark",
  "mono",
  "matrix",
  "midnight",
  "crimson",
  "sunset",
]

// Cached by primitive keys so generateMetadata and the page share one fetch per
// request even though React `cache` keys on argument identity. `sections` is
// therefore passed as a JSON string — JSON rather than a delimiter join so a
// section name containing the delimiter can't be silently split in two.
const loadPortfolio = cache((login: string, sectionsKey: string) =>
  getPortfolioData(
    login,
    sectionsKey ? (JSON.parse(sectionsKey) as string[]) : undefined
  )
)
const loadSubdomain = cache((subdomain: string) => resolveSubdomain(subdomain))

const sectionsKeyOf = (sections?: string[]) =>
  sections?.length ? JSON.stringify(sections) : ""

/**
 * Parse dashboard "Preview" query params (`?preview=1&login=&template=&theme=`)
 * into a validated PreviewParams, or null when not a preview request. Template
 * and theme are constrained to the known enums; anything else is ignored.
 */
export function parsePreview(
  params: Record<string, string | string[] | undefined>
): PreviewParams | null {
  if (!params.preview) return null
  const login = typeof params.login === "string" ? params.login.trim() : ""
  if (!/^[a-zA-Z0-9-]{1,39}$/.test(login)) return null

  const t = params.template
  const template =
    typeof t === "string" && (TEMPLATES as string[]).includes(t)
      ? (t as TemplateName)
      : "terminal"

  const th = params.theme
  const theme =
    typeof th === "string" && (THEMES as string[]).includes(th)
      ? (th as PortfolioTheme)
      : undefined

  return { login, template, theme }
}

// Resolve the incoming request to a fully-loaded portfolio, or null.
//
// Preview: a validated PreviewParams (from the dashboard) renders any GitHub
// login in a chosen template without a subdomain — public, sanitized, no auth.
// Preview always renders the whole README; `portfolio.sections` is a property of
// a claimed subdomain's config, which a preview by definition doesn't have yet.
//
// Production: proxy.ts sets `x-portfolio-subdomain` from the Host header. We
// resolve it against the domains repo; a subdomain that exists but has no
// portfolio block, or doesn't exist at all, yields null → 404.
//
// Local dev / apex (no subdomain header): fall back to PORTFOLIO_SPIKE_SUBDOMAIN
// or PORTFOLIO_SPIKE_LOGIN so the pipeline is runnable without wildcard DNS.
export async function getRenderContext(
  preview?: PreviewParams | null
): Promise<RenderContext | null> {
  if (preview) {
    const data = await loadPortfolio(preview.login, "")
    if (!data) return null
    return {
      login: preview.login,
      template: preview.template,
      theme: preview.theme,
      data,
      subdomain: null,
    }
  }

  const h = await headers()
  const subdomain =
    h.get("x-portfolio-subdomain") ??
    process.env.PORTFOLIO_SPIKE_SUBDOMAIN ??
    ""

  if (subdomain) {
    const resolved = await loadSubdomain(subdomain)
    if (!resolved) return null
    const data = await loadPortfolio(
      resolved.github,
      sectionsKeyOf(resolved.portfolio.sections)
    )
    if (!data) return null
    return {
      login: resolved.github,
      template: resolved.portfolio.template,
      theme: resolved.portfolio.theme,
      data,
      subdomain,
    }
  }

  // No subdomain at all — dev/apex fallback so the renderer is demoable.
  const login = process.env.PORTFOLIO_SPIKE_LOGIN
  if (!login) return null
  const data = await loadPortfolio(login, "")
  if (!data) return null
  return { login, template: "terminal", data, subdomain: null }
}
