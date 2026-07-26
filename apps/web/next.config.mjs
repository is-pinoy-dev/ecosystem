import { execSync } from "node:child_process"
import createMDX from "@next/mdx"

const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7)

// Date of the commit this build came from. Baked in at build time so the footer
// reports when the site actually changed instead of whenever the page rendered.
const lastUpdated = (() => {
  try {
    return execSync("git log -1 --format=%cI", { encoding: "utf8" }).trim()
  } catch {
    return new Date().toISOString()
  }
})()

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@is-pinoy-dev/ui"],
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  env: {
    NEXT_PUBLIC_LAST_UPDATED: lastUpdated,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "github.com", pathname: "/*.png" },
    ],
  },
  async redirects() {
    return [
      // The badge kit now lives in the docs site.
      {
        source: "/badges",
        destination: "https://docs.is-pinoy.dev/badge-kit",
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, { key: "X-Commit-SHA", value: sha }],
      },
    ]
  },
}

const withMDX = createMDX()

export default withMDX(nextConfig)
