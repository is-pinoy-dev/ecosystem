import type { Metadata, Viewport } from "next"
import { notFound } from "next/navigation"
import { PortfolioShell } from "@/components/portfolio-shell"
import { PortfolioJsonLd } from "@/components/portfolio-json-ld"
import { getRenderContext, parsePreview, type RenderContext } from "@/lib/context"
import { renderTemplate, isDesignerTemplate } from "@/templates"
import {
  SITE_NAME,
  backgroundFor,
  buildJsonLd,
  descriptionFor,
  displayName,
  iconsFor,
  isLight,
  keywordsFor,
  originFor,
} from "@/lib/seo"

// Reading the Host-derived header makes this route dynamic per subdomain; the
// upstream GitHub fetches are still ISR-cached (1h) inside lib/github.ts, so
// freshness stays pure revalidation without statically pinning one profile.
export const dynamic = "force-dynamic"

type SearchParams = Record<string, string | string[] | undefined>

/**
 * The browser and OS chrome around the page — address bar, task switcher, PWA
 * splash. It has to match the design that is about to paint, and each template
 * paints a different one, so this is per-request rather than a layout constant.
 */
export async function generateViewport({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Viewport> {
  const preview = parsePreview(await searchParams)
  const ctx = await getRenderContext(preview)
  const background = ctx
    ? backgroundFor(ctx.template, ctx.theme)
    : backgroundFor("terminal")

  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    themeColor: background,
    // Declared from the background's own luminance so form controls, scrollbars
    // and the UA's default canvas match the design rather than fighting it.
    colorScheme: isLight(background) ? "light" : "dark",
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const preview = parsePreview(await searchParams)
  const ctx = await getRenderContext(preview)
  // No robots directive here: this branch always ends in notFound(), and
  // app/not-found.tsx supplies the noindex for it.
  if (!ctx) return { title: `Not found — ${SITE_NAME}` }

  const { profile } = ctx.data
  const name = displayName(profile)
  const title = `${name} — Portfolio`
  const description = descriptionFor(ctx.data)
  const origin = originFor(ctx.subdomain)
  // Only a claimed subdomain is a real, canonical site. A preview renders an
  // arbitrary login on our host, and the dev/apex fallback is a demo — both are
  // the same content served from an address that isn't its home, which is the
  // textbook duplicate a canonical tag exists to prevent. Neither is indexed,
  // so neither gets one.
  const canonical = ctx.subdomain ? origin : null

  return {
    metadataBase: new URL(origin),
    title: { absolute: title },
    description,
    applicationName: title,
    keywords: keywordsFor(ctx.data),
    authors: [{ name, url: `https://github.com/${profile.login}` }],
    creator: name,
    publisher: SITE_NAME,
    category: "technology",
    ...(canonical ? { alternates: { canonical } } : {}),
    icons: iconsFor(profile.avatar),
    manifest: "/manifest.webmanifest",
    // The tab icon is the owner's face; so is the icon an installed copy gets.
    appleWebApp: { capable: true, title: name, statusBarStyle: "default" },
    formatDetection: { telephone: false, address: false, email: false },
    robots: canonical
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false },
    openGraph: {
      type: "profile",
      username: profile.login,
      title,
      description,
      siteName: SITE_NAME,
      locale: "en_PH",
      ...(canonical ? { url: canonical } : {}),
      images: [ogImage(ctx.subdomain, profile.avatar, name)],
    },
    twitter: {
      // The generated card is a 1200x630 banner; the avatar fallback is square.
      card: ctx.subdomain ? "summary_large_image" : "summary",
      title,
      description,
      images: [ogImage(ctx.subdomain, profile.avatar, name).url],
      ...(profile.twitter ? { creator: `@${profile.twitter}` } : {}),
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
        url: `https://${subdomain}.${SITE_NAME}/_tools/og/image`,
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

  return (
    <>
      <StructuredData ctx={ctx} />
      {/* Designer templates are self-contained (own background + footer);
          render them directly. Layout templates get the theme shell. */}
      {isDesignerTemplate(ctx.template) ? (
        rendered
      ) : (
        <PortfolioShell theme={ctx.theme} login={ctx.login}>
          {rendered}
        </PortfolioShell>
      )}
    </>
  )
}

/** Structured data describes a person at an address. Only a claimed subdomain
 * has one, so a preview emits none rather than a graph naming our host. */
function StructuredData({ ctx }: { ctx: RenderContext }) {
  if (!ctx.subdomain) return null
  return (
    <PortfolioJsonLd
      graph={buildJsonLd({ data: ctx.data, origin: originFor(ctx.subdomain) })}
    />
  )
}
