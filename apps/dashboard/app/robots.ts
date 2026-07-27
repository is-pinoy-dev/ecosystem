import type { MetadataRoute } from "next"

// The dashboard is session-gated, so nothing behind the login is crawlable.
// `/login` and the OG image stay allowed: they hold no user data, and link
// unfurlers (Slackbot, Twitterbot, Discord) honour robots.txt — a blanket
// `Disallow: /` would strip previews from every shared dashboard link.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/login", "/opengraph-image"],
        disallow: "/",
      },
    ],
    sitemap: "https://dashboard.is-pinoy.dev/sitemap.xml",
    host: "https://dashboard.is-pinoy.dev",
  }
}
