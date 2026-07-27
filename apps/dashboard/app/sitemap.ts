import type { MetadataRoute } from "next"

// Only the sign-in page is public; every other route redirects to it without a
// session, so listing them would advertise URLs crawlers can never fetch.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://dashboard.is-pinoy.dev/login",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ]
}
