import type { MetadataRoute } from "next"
import { getHostSubdomain, isClaimedHost } from "@/lib/context"
import { originFor } from "@/lib/seo"

// Per-host, so it cannot be pre-rendered: the same deployment answers for every
// claimed portfolio and for the renderer host itself, and those want opposite
// rules.
export const dynamic = "force-dynamic"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const subdomain = await getHostSubdomain()

  // The renderer host (and anything unclaimed) serves other people's content at
  // a hostname that is nobody's site. Keeping it out of the index is what stops
  // portfolio.is-pinoy.dev from competing with the portfolios themselves.
  if (!subdomain || !(await isClaimedHost())) {
    return { rules: [{ userAgent: "*", disallow: "/" }] }
  }

  const origin = originFor(subdomain)
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // `?preview=` renders an arbitrary GitHub login on whatever host it is
        // requested from — real content at a URL that isn't its home. The page
        // already sends `noindex` for it; this saves the crawl as well.
        disallow: ["/*?preview="],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  }
}
