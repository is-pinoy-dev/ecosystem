import { createMDX } from "fumadocs-mdx/next"

const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7)

const withMDX = createMDX()

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-no-referrer-when-downgrade" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
]

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/', destination: '/guides', permanent: false },
      { source: '/getting-started', destination: '/guides/getting-started', permanent: true },
      { source: '/getting-started/:path*', destination: '/guides/getting-started/:path*', permanent: true },
      { source: '/providers', destination: '/guides/providers', permanent: true },
      { source: '/providers/:path*', destination: '/guides/providers/:path*', permanent: true },
      { source: '/workflow', destination: '/guides/workflow', permanent: true },
      { source: '/workflow/:path*', destination: '/guides/workflow/:path*', permanent: true },
      { source: '/reference', destination: '/guides/reference', permanent: true },
      { source: '/reference/:path*', destination: '/guides/reference/:path*', permanent: true },
      { source: '/troubleshooting', destination: '/guides/troubleshooting', permanent: true },
      { source: '/troubleshooting/:path*', destination: '/guides/troubleshooting/:path*', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [...securityHeaders, { key: "X-Commit-SHA", value: sha }],
      },
    ]
  },
}

export default withMDX(config)
