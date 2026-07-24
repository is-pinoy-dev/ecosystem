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

export const metadata: Metadata = {
  title: "Portfolio — is-pinoy.dev",
  description: "A portfolio rendered from a GitHub profile, hosted on is-pinoy.dev.",
  robots: { index: false },
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
