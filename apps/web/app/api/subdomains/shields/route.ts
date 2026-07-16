import { NextResponse } from "next/server"
import { getRegisteredSubdomains } from "@/lib/subdomains"

// shields.io "endpoint" badge for the number of registered subdomains.
// Consume from a README with:
//   https://img.shields.io/endpoint?url=https://is-pinoy.dev/api/subdomains/shields
//
// The count comes from the shared getRegisteredSubdomains() utility, so it
// matches the site exactly (destroyed entries are already filtered out — a raw
// GitHub file-count badge would over-count them).
//
// Freshness — the badge is guaranteed to update well within a day at every layer:
//   - underlying GitHub fetches: revalidate 3600s (1h)
//   - this route (ISR):          revalidate 3600s (1h)
//   - CDN / shields cache:        s-maxage 3600s + cacheSeconds 3600 (1h)
export const revalidate = 3600

const CACHE_SECONDS = 3600

export async function GET() {
  const entries = await getRegisteredSubdomains()

  // shields.io endpoint schema: https://shields.io/badges/endpoint-badge
  return NextResponse.json(
    {
      schemaVersion: 1,
      label: "subdomains",
      message: String(entries.length),
      color: "F5C800",
      cacheSeconds: CACHE_SECONDS,
    },
    {
      headers: {
        "Cache-Control": `public, max-age=0, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=86400`,
      },
    },
  )
}
