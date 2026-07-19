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

export const metadata: Metadata = {
  metadataBase: new URL("https://dashboard.is-pinoy.dev"),
  applicationName: "is-pinoy.dev dashboard",
  title: {
    default: "Dashboard | is-pinoy.dev",
    template: "%s | is-pinoy.dev dashboard",
  },
  description:
    "Manage your free .is-pinoy.dev subdomains. Sign in with GitHub to see your registered domains and DNS records.",
  robots: {
    index: false,
    follow: false,
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
