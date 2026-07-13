import { RootProvider } from "fumadocs-ui/provider/next"
import "./global.css"
import type { Metadata, Viewport } from "next"

export const viewport: Viewport = {
  themeColor: "#FAF9F5",
  colorScheme: "light dark",
}

export const metadata: Metadata = {
  metadataBase: new URL("https://docs.is-pinoy.dev"),
  title: {
    template: "%s | is-pinoy.dev docs",
    default: "is-pinoy.dev docs",
  },
  description: "Documentation for the is-pinoy.dev ecosystem.",
  keywords: [
    "Filipino developers",
    "free subdomain",
    "is-pinoy.dev",
    "portfolio subdomain",
    "Pilipinas",
  ],
  category: "technology",
  creator: "is-pinoy.dev",
  openGraph: {
    siteName: "is-pinoy.dev docs",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "is-pinoy.dev docs",
  url: "https://docs.is-pinoy.dev",
  isPartOf: {
    "@type": "Organization",
    name: "is-pinoy.dev",
    url: "https://is-pinoy.dev",
    sameAs: [
      "https://is-pinoy.dev",
      "https://github.com/is-pinoy-dev/ecosystem",
      "https://discord.gg/MVrgEfFExh",
    ],
  },
}

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
