import type { Metadata, Viewport } from "next"
import { Press_Start_2P, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
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
  description: "Claim your free .is-pinoy.dev subdomain. Open source, community-driven, forever free. Para sa mga Pinoy developer.",
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
    title: "is-pinoy.dev — Free Subdomains for Filipino Developers",
    description: "Claim your free .is-pinoy.dev subdomain. Open source, community-driven, forever free.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "is-pinoy.dev — Free Subdomains for Filipino Developers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "is-pinoy.dev — Free Subdomains for Filipino Developers",
    description: "Claim your free .is-pinoy.dev subdomain. Open source, community-driven, forever free.",
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

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
})

const sansFont = IBM_Plex_Sans({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-sans",
})

const monoFont = IBM_Plex_Mono({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body className={`${pixelFont.variable} ${sansFont.variable} ${monoFont.variable}`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
