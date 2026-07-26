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
      images: [{ url: profile.avatar, width: 460, height: 460, alt: name }],
    },
    twitter: { card: "summary", title: name, description },
  }
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
