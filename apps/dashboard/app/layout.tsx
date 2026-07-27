import type { Metadata, Viewport } from "next"
import "@is-pinoy-dev/ui/globals.css"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0D12" },
    { media: "(prefers-color-scheme: light)", color: "#FDFCFA" },
  ],
  colorScheme: "light dark",
}

const SITE_URL = "https://dashboard.is-pinoy.dev"

const DESCRIPTION =
  "Manage your free .is-pinoy.dev subdomains. Sign in with GitHub to see your registered domains, DNS records, and pending changes."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "is-pinoy.dev dashboard",
  // Page names already say what this is ("Domains", "Account"), and the host
  // is dashboard.is-pinoy.dev — so the suffix is just the brand, matching the
  // web app's `%s | is-pinoy.dev`.
  title: {
    default: "Dashboard | is-pinoy.dev",
    template: "%s | is-pinoy.dev",
  },
  description: DESCRIPTION,
  authors: [{ name: "is-pinoy-dev", url: "https://github.com/is-pinoy-dev" }],
  creator: "is-pinoy-dev",
  publisher: "is-pinoy-dev",
  category: "technology",
  alternates: {
    canonical: "/",
  },
  // Signed-in surfaces are all numbers and domain names; stop mobile browsers
  // from linkifying them as phone numbers or addresses.
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: SITE_URL,
    siteName: "is-pinoy.dev dashboard",
    title: "is-pinoy.dev dashboard",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "is-pinoy.dev dashboard",
    description: DESCRIPTION,
    images: ["/opengraph-image"],
  },
  // Everything behind the session gate stays out of search results. The login
  // page opts back in with its own `robots` block.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
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
