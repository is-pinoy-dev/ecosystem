import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PortfolioShell } from "@/components/portfolio-shell"
import { getRenderContext, parsePreview } from "@/lib/context"
import { renderTemplate, isDesignerTemplate } from "@/templates"

// Reading the Host-derived header makes this route dynamic per subdomain; the
// upstream GitHub fetches are still ISR-cached (1h) inside lib/github.ts, so
// freshness stays pure revalidation without statically pinning one profile.
export const dynamic = "force-dynamic"

type SearchParams = Record<string, string | string[] | undefined>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const preview = parsePreview(await searchParams)
  const ctx = await getRenderContext(preview)
  // No robots directive here: this branch always ends in notFound(), and
  // app/not-found.tsx supplies the noindex for it.
  if (!ctx) return { title: "Not found — is-pinoy.dev" }

  const { profile } = ctx.data
  const name = profile.name ?? profile.login
  const description =
    profile.bio ?? `${name}'s portfolio, built from their GitHub profile.`

  return {
    title: `${name} — is-pinoy.dev`,
    description,
    // A claimed portfolio is the owner's public site — indexable. A preview
    // renders any login on our host with no claim behind it, so it stays out of
    // search results entirely.
    robots: preview
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: name,
      description,
      images: [ogImage(ctx.subdomain, profile.avatar, name)],
    },
    twitter: {
      // The generated card is a 1200x630 banner; the avatar fallback is square.
      card: ctx.subdomain ? "summary_large_image" : "summary",
      title: name,
      description,
    },
  }
}

/**
 * The share image for a portfolio.
 *
 * A claimed subdomain is proxied by definition, so the platform's generated OG
 * card is reachable at its own `/_tools/og/image` — 1200x630 and branded, which
 * previews far better than the square GitHub avatar. Owners of subdomains that
 * point at their own host have to reference that endpoint themselves; here we
 * render the page, so we can just use it.
 *
 * A preview renders on portfolio.is-pinoy.dev, where that path would resolve to
 * a different record entirely, so it keeps the avatar.
 */
function ogImage(subdomain: string | null, avatar: string, name: string) {
  return subdomain
    ? {
        url: `https://${subdomain}.is-pinoy.dev/_tools/og/image`,
        width: 1200,
        height: 630,
        alt: name,
      }
    : { url: avatar, width: 460, height: 460, alt: name }
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const preview = parsePreview(await searchParams)
  const ctx = await getRenderContext(preview)
  if (!ctx) notFound()

  const rendered = renderTemplate(ctx.template, { data: ctx.data })

  // Designer templates are self-contained (own background + footer); render
  // them directly. Layout templates get the theme shell.
  if (isDesignerTemplate(ctx.template)) return rendered

  return (
    <PortfolioShell theme={ctx.theme} login={ctx.login}>
      {rendered}
    </PortfolioShell>
  )
}
