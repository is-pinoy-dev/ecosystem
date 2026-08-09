import type { MetadataRoute } from "next"
import { getHostSubdomain, isClaimedHost } from "@/lib/context"
import { originFor } from "@/lib/seo"

export const dynamic = "force-dynamic"

// A portfolio has exactly one URL, and its content changes when GitHub is
// re-read — every hour, on the ISR window in lib/github.ts. Reporting "now" on
// every crawl would claim a change that didn't happen, so `lastModified` is
// pinned to the top of the current window: it moves when the content can.
const HOUR_MS = 3_600_000

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const subdomain = await getHostSubdomain()
  if (!subdomain || !(await isClaimedHost())) return []

  return [
    {
      url: originFor(subdomain),
      lastModified: new Date(Math.floor(Date.now() / HOUR_MS) * HOUR_MS),
      changeFrequency: "weekly",
      priority: 1,
    },
  ]
}
