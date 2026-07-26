import type { MetadataRoute } from "next"

// Same build-time commit date the footer shows — a sitemap that reports "now"
// on every crawl tells search engines nothing about what actually changed.
const lastModified = new Date(
  process.env.NEXT_PUBLIC_LAST_UPDATED ?? Date.now()
)

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://is-pinoy.dev",
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://is-pinoy.dev/showcase",
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: "https://is-pinoy.dev/privacy",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: "https://is-pinoy.dev/tos",
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]
}
