import type { Metadata, Viewport } from "next"
import "@is-pinoy-dev/ui/globals.css"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0D0D0D" },
    { media: "(prefers-color-scheme: light)", color: "#FAFAF5" },
  ],
  colorScheme: "dark light",
}

export const metadata: Metadata = {
  metadataBase: new URL("https://is-pinoy.dev"),
  applicationName: "is-pinoy.dev",
  title: {
    default: "is-pinoy.dev — Free Subdomains for Filipino Developers",
    template: "%s | is-pinoy.dev",
  },
  description:
    "Claim your free .is-pinoy.dev subdomain. Open source, community-driven, forever free. Para sa mga Pinoy developer.",
  keywords: [
    "free subdomain",
    "filipino developers",
    "pinoy dev",
    "is-pinoy.dev",
    "open source",
    "subdomain",
    "developer tools",
    "pinoy programmer",
    "philippines developer",
    "free domain",
    "custom subdomain",
    "developer community",
    "CNAME",
  ],
  authors: [{ name: "is-pinoy-dev", url: "https://github.com/is-pinoy-dev" }],
  creator: "is-pinoy-dev",
  publisher: "is-pinoy-dev",
  category: "technology",
  alternates: {
    canonical: "https://is-pinoy.dev",
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "https://is-pinoy.dev",
    siteName: "is-pinoy.dev",
    title: "is-pinoy.dev — Free subdomains for Filipino developers.",
    description:
      "A community-run home for Pinoy developers to claim free is-pinoy.dev subdomains.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "is-pinoy.dev — Free subdomains for Filipino developers.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "is-pinoy.dev — Free subdomains for Filipino developers.",
    description:
      "A community-run home for Pinoy developers to claim free is-pinoy.dev subdomains.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
