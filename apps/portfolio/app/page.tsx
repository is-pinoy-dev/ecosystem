import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PortfolioShell } from "@/components/portfolio-shell"
import { getRenderContext, parsePreview } from "@/lib/context"
import { renderTemplate } from "@/templates"

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
  if (!ctx) return { title: "Not found — is-pinoy.dev" }

  const { profile } = ctx.data
  const name = profile.name ?? profile.login
  const description =
    profile.bio ?? `${name}'s portfolio, built from their GitHub profile.`

  return {
    title: `${name} — is-pinoy.dev`,
    description,
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

  return (
    <PortfolioShell theme={ctx.theme} login={ctx.login}>
      {renderTemplate(ctx.template, { data: ctx.data })}
    </PortfolioShell>
  )
}
