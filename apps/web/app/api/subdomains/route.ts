import { NextResponse } from "next/server"
import { getRegisteredSubdomains } from "@/lib/subdomains"

// Public, cached JSON list of registered subdomains, newest-first by
// registration date. Backed by the shared getRegisteredSubdomains() utility.
//
// Caching strategy:
//   - `revalidate` makes Next serve a statically-rendered, ISR-cached response
//     (the underlying GitHub fetches are also cached for the same window).
//   - `Cache-Control` lets the CDN (and any downstream proxy such as GitHub's
//     Camo or shields.io) cache the payload and serve stale copies while a
//     fresh one is regenerated in the background.
export const revalidate = 3600

const CACHE_CONTROL = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400"

export async function GET() {
  const entries = await getRegisteredSubdomains()

  const subdomains = entries.map((entry) => ({
    subdomain: entry.subdomain,
    url: `https://${entry.subdomain}.is-pinoy.dev`,
    owner: entry.owner.github,
    createdOn: entry.createdOn,
    updatedOn: entry.updatedOn,
  }))

  return NextResponse.json(
    {
      count: subdomains.length,
      generatedAt: new Date().toISOString(),
      subdomains,
    },
    { headers: { "Cache-Control": CACHE_CONTROL } },
  )
}
