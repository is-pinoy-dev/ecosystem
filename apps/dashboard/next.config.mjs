const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7)

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-no-referrer-when-downgrade" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@is-pinoy-dev/ui"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
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

export default nextConfig
