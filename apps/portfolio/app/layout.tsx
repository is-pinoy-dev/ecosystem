import type { Metadata, Viewport } from "next"
import "@is-pinoy-dev/ui/globals.css"
import "./readme.css"
import "./globals.css"
import "./themes.css"
import "./designer-themes.css"
import { SITE_NAME, backgroundFor } from "@/lib/seo"

// Defaults only. app/page.tsx exports `generateViewport`, which replaces these
// with the colors of the template about to paint; what is left here is what a
// 404 or an error boundary gets.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: backgroundFor("terminal"),
  colorScheme: "dark light",
}

// Indexing is decided per request, not here: a claimed portfolio is a real
// public site and should be indexable, while `?preview=` renders an arbitrary
// GitHub login on our host and must never be indexed. See app/page.tsx, which
// also replaces the title, description and icons below with the owner's own.
export const metadata: Metadata = {
  title: `Portfolio — ${SITE_NAME}`,
  description: `A portfolio rendered from a GitHub profile, hosted on ${SITE_NAME}.`,
  // The brand marks, for the pages that belong to us rather than to an owner —
  // 404s and errors. A rendered portfolio swaps these for the owner's avatar.
  //
  // No favicon.svg here, unlike apps/web: that file is a 570KB raster wrapped
  // in an <svg>, and browsers prefer it over the .ico when both are offered.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Every portfolio pulls its avatar from GitHub's CDN, and most READMEs
            pull badges and inline images from the other two. Opening those
            connections while the HTML is still streaming is the difference
            between the avatar arriving with the layout and arriving after it.
            Written as markup rather than react-dom's preconnect(): called from
            a Server Component that ships the hint down the RSC stream, which
            lands after hydration — too late to be worth anything. */}
        <link rel="preconnect" href="https://avatars.githubusercontent.com" />
        <link rel="dns-prefetch" href="https://raw.githubusercontent.com" />
        <link rel="dns-prefetch" href="https://img.shields.io" />
      </head>
      <body>{children}</body>
    </html>
  )
}
