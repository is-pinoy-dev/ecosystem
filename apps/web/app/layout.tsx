import type { Metadata } from "next"
import { Press_Start_2P, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  metadataBase: new URL("https://is-pinoy.dev"),
  title: {
    default: "is-pinoy.dev — Free Subdomains for Filipino Developers",
    template: "%s | is-pinoy.dev",
  },
  description: "Claim your free .is-pinoy.dev subdomain. Open source, community-driven, forever free. Para sa mga Pinoy developer.",
  keywords: ["free subdomain", "filipino developers", "pinoy dev", "is-pinoy.dev", "open source", "subdomain"],
  authors: [{ name: "is-pinoy-dev", url: "https://github.com/is-pinoy-dev" }],
  creator: "is-pinoy-dev",
  openGraph: {
    type: "website",
    locale: "en_PH",
    url: "https://is-pinoy.dev",
    siteName: "is-pinoy.dev",
    title: "is-pinoy.dev — Free Subdomains for Filipino Developers",
    description: "Claim your free .is-pinoy.dev subdomain. Open source, community-driven, forever free.",
  },
  twitter: {
    card: "summary_large_image",
    title: "is-pinoy.dev — Free Subdomains for Filipino Developers",
    description: "Claim your free .is-pinoy.dev subdomain. Open source, community-driven, forever free.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
