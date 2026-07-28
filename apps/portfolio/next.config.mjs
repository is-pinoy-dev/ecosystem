const sha = (process.env.VERCEL_GIT_COMMIT_SHA ?? "dev").slice(0, 7)

// The only hosts a rendered portfolio may load an image from. README badges and
// avatars come from GitHub's asset hosts; anything else is dropped by the
// sanitizer (see lib/parse.ts) before it ever reaches an <img>.
//
// This list is the single source for both `images.remotePatterns` and the CSP
// `img-src` below. It must stay in step with IMG_ALLOW_HOSTS in lib/parse.ts —
// tests/csp.test.ts fails if the two drift apart.
export const IMAGE_HOSTS = [
  "avatars.githubusercontent.com",
  "raw.githubusercontent.com",
  "github.com",
  "img.shields.io",
]

// Second layer behind the sanitizer, for the same threat model: a profile README
// is arbitrary third-party HTML served on a cookie domain shared with the
// dashboard. If a sanitizer bypass ever lands, these directives still deny the
// payload its exits — beacon images, framing, form posts, and <base> hijacking.
//
// Still deliberately no `default-src` or `script-src`: Next injects inline
// hydration scripts, so restricting those needs per-request nonces and a broken
// CSP is worse than a narrow one. Directives left unset are unrestricted.
//
// `style-src` and `font-src` ARE set, as groundwork for community themes (see
// docs/superpowers/specs/2026-07-28-community-themes-design.md). Both are
// stylesheet *fetch* directives, which is the point:
//
//   - `style-src` keeps `'unsafe-inline'`, because Next emits inline styles and
//     the designer templates use React `style={{}}` attributes (`style-src-attr`
//     falls back to `style-src`, so dropping it would break them). It still
//     denies remote stylesheets — a `<link>` or an `@import url(https://…)`
//     resolves against the source list, not against `'unsafe-inline'`. That is
//     the hole that matters here: `@import` would otherwise let a reviewed theme
//     swap its own contents after approval.
//   - `font-src 'self'` closes `@font-face { src: url(https://…) }`, which is
//     the one exfiltration path CSS has left once `img-src` is pinned. Fonts are
//     self-hosted woff2 bundled through the CSS pipeline, so 'self' covers them.
//
// Neither is sufficient on its own — the ingest-time CSS allow-list is the
// actual boundary. These are the layer behind it.
const csp = [
  `img-src 'self' data: ${IMAGE_HOSTS.map((h) => `https://${h}`).join(" ")}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join("; ")

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Origin-only on cross-origin requests: a portfolio links out to arbitrary
  // URLs from its owner's README, and the full path shouldn't ride along.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: csp },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@is-pinoy-dev/ui"],
  images: {
    remotePatterns: IMAGE_HOSTS.map((hostname) => ({
      protocol: "https",
      hostname,
    })),
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
