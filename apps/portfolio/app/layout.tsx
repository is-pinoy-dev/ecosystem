import type { Metadata, Viewport } from "next"
import "@is-pinoy-dev/ui/globals.css"
import "./globals.css"
import "./themes.css"
import "./designer-themes.css"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "dark light",
}

// Indexing is decided per request, not here: a claimed portfolio is a real
// public site and should be indexable, while `?preview=` renders an arbitrary
// GitHub login on our host and must never be indexed. See app/page.tsx.
export const metadata: Metadata = {
  title: "Portfolio — is-pinoy.dev",
  description: "A portfolio rendered from a GitHub profile, hosted on is-pinoy.dev.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
