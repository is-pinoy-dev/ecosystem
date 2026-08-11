import type { MetadataRoute } from "next"
import type { PortfolioData, Profile } from "./portfolio-data"

// Everything a hosted portfolio needs to behave like a real site rather than a
// rendered README: canonical origin, favicons, manifest, theme color, and the
// structured data that turns a page into a Person in a search index.
//
// Deliberately pure — no `next/headers`, no React, no component imports. The
// metadata routes (app/robots.ts, app/sitemap.ts, app/manifest.ts) and
// app/page.tsx all wire the same helpers, and tests/seo.test.ts can call them
// with a plain object instead of standing up a request.

// Mirrors proxy.ts, which reads the same variable to extract the label. A
// preview or the dev/apex fallback has no label and belongs to the renderer
// host itself, which is never the canonical home of anybody's portfolio.
export const ROOT_DOMAIN = process.env.PORTFOLIO_ROOT_DOMAIN ?? "is-pinoy.dev"
export const RENDERER_HOST = `portfolio.${ROOT_DOMAIN}`
export const SITE_NAME = ROOT_DOMAIN

/** The origin a portfolio is actually served from. */
export function originFor(subdomain: string | null): string {
  return `https://${subdomain ? `${subdomain}.${ROOT_DOMAIN}` : RENDERER_HOST}`
}

/** The owner's display name, falling back to their login. */
export function displayName(profile: Profile): string {
  return profile.name?.trim() || profile.login
}

/**
 * A GitHub avatar at a requested pixel size. The API hands us
 * `.../u/<id>?v=4`, which is 460px — far too heavy for a 32px favicon and too
 * small to declare as a 512px install icon, and both are the same image with a
 * different `s`.
 */
export function avatarUrl(avatar: string, size: number): string {
  try {
    const url = new URL(avatar)
    url.searchParams.set("s", String(size))
    return url.toString()
  } catch {
    // A non-absolute avatar can't come out of the GitHub API, but a template
    // fixture or a future data source could hand us one; don't lose it.
    return avatar
  }
}

// The page background each design paints, kept in step with app/themes.css and
// app/designer-themes.css. It drives `theme-color` (the browser/OS chrome
// around the page) and the manifest's splash colors — get it wrong and an
// installed portfolio flashes the wrong color on every launch.
//
// Designer templates own their whole page, so they key on the template name;
// layout templates are painted by the shared shell, so they key on the theme.
const DESIGNER_BACKGROUND: Record<string, string> = {
  concrete: "#e8e8e6",
  broadsheet: "#f6f2e9",
  phosphor: "#020402",
  draft: "#0a2036",
  bubblegum: "#ffe0ec",
  grid: "#ffffff",
  bento: "#dce7d5",
  noir: "#0a0a09",
  solar: "#f45a32",
}

const THEME_BACKGROUND: Record<string, string> = {
  "gold-dark": "#0b0d12",
  mono: "#0b0d12",
  matrix: "#030503",
  midnight: "#0a0f1e",
  crimson: "#14090b",
  sunset: "#16101d",
}

/** `gold-dark` inherits the app's base dark tokens and defines no block. */
const DEFAULT_BACKGROUND = THEME_BACKGROUND["gold-dark"]!

export function backgroundFor(template: string, theme?: string): string {
  return (
    DESIGNER_BACKGROUND[template] ??
    THEME_BACKGROUND[theme ?? "gold-dark"] ??
    DEFAULT_BACKGROUND
  )
}

/**
 * Whether a background reads as light, by WCAG relative luminance rather than a
 * hand-kept list — a new designer template gets the right `color-scheme` from
 * its hex alone. Threshold at 0.5 puts every current design on the side a human
 * would put it on.
 */
export function isLight(hex: string): boolean {
  const value = hex.replace("#", "")
  const full =
    value.length === 3
      ? value
          .split("")
          .map((c) => c + c)
          .join("")
      : value
  const channel = (offset: number) => {
    const srgb = parseInt(full.slice(offset, offset + 2), 16) / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  }
  const luminance =
    0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4)
  return luminance > 0.5
}

/** The languages this owner actually ships in, most-used first. */
export function topLanguages(data: PortfolioData, limit = 5): string[] {
  const counts = new Map<string, number>()
  for (const repo of data.repos) {
    if (!repo.language) continue
    counts.set(repo.language, (counts.get(repo.language) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([language]) => language)
}

// A search result cuts the title off around here, and a cut title loses the
// suffix that says what the page is. A GitHub display name can be 255
// characters, so the name yields rather than the suffix.
export const MAX_TITLE = 60
const TITLE_SUFFIX = " — Portfolio"

/** The page title: the owner's name, then what the page is. */
export function titleFor(profile: Profile): string {
  const name = displayName(profile)
  return `${truncate(name, MAX_TITLE - TITLE_SUFFIX.length)}${TITLE_SUFFIX}`
}

// The window a search result actually shows, and the window every SEO auditor
// (ours at /_tools/site-audit included) grades against. Under the floor the
// engine ignores our description and invents a snippet from the page; over the
// ceiling it truncates mid-sentence.
export const MIN_DESCRIPTION = 50
export const MAX_DESCRIPTION = 160

/**
 * The meta description. A GitHub bio is the owner's own one-liner and always
 * leads; the rest is appended only while it still fits, so a long bio is never
 * cut mid-word by a sentence we chose to add.
 *
 * The one exception is a bio too short to be a description at all — "Dev." is
 * a legitimate GitHub bio and a useless snippet. Below the floor the next
 * sentence goes on regardless of the budget, and `truncate` trims the result
 * back to the ceiling.
 */
export function descriptionFor(data: PortfolioData): string {
  const { profile, stats } = data
  const name = displayName(profile)
  const bio = profile.bio?.trim()
  const summary = `${name}'s developer portfolio, built from their GitHub profile.`

  const sentences = [bio || summary]
  if (profile.location) sentences.push(`Based in ${profile.location}.`)
  const languages = topLanguages(data, 3)
  if (languages.length) sentences.push(`Works with ${listSentence(languages)}.`)
  if (stats.publicRepos) {
    sentences.push(`${stats.publicRepos} public repositories on GitHub.`)
  }
  // Last resort for a profile that is a two-word bio and nothing else: the
  // sentence we would have led with had there been no bio at all.
  if (bio) sentences.push(summary)

  let out = sentences[0]!
  for (const sentence of sentences.slice(1)) {
    const extended = `${out} ${sentence}`
    if (extended.length > MAX_DESCRIPTION && out.length >= MIN_DESCRIPTION) break
    out = extended
  }
  return truncate(out, MAX_DESCRIPTION)
}

/** Terms a portfolio is plausibly searched by. */
export function keywordsFor(data: PortfolioData): string[] {
  const { profile } = data
  const name = displayName(profile)
  const keywords = [
    name,
    profile.login,
    `${name} portfolio`,
    "developer portfolio",
    "software developer",
    "github profile",
    "filipino developer",
    SITE_NAME,
    ...topLanguages(data, 5),
  ]
  if (profile.location) keywords.push(profile.location)
  if (profile.company) keywords.push(profile.company.replace(/^@/, ""))
  return dedupe(keywords)
}

/**
 * Favicons and install icons, from the owner's avatar.
 *
 * A hosted portfolio is the owner's site, so its tab icon is the owner's face —
 * not our logo. No `type` is declared: GitHub serves avatars as PNG or JPEG
 * depending on what was uploaded, and a wrong hint is worse than none.
 */
export function iconsFor(avatar: string) {
  return {
    icon: [
      { url: avatarUrl(avatar, 32), sizes: "32x32" },
      { url: avatarUrl(avatar, 96), sizes: "96x96" },
      { url: avatarUrl(avatar, 192), sizes: "192x192" },
    ],
    apple: [{ url: avatarUrl(avatar, 180), sizes: "180x180" }],
    shortcut: [{ url: avatarUrl(avatar, 32), sizes: "32x32" }],
  }
}

/**
 * The web app manifest for a claimed portfolio, so "Add to Home Screen" installs
 * the owner's site under the owner's name and icon rather than a browser
 * bookmark titled after our renderer.
 */
export function manifestFor(args: {
  data: PortfolioData
  template: string
  theme?: string
}): MetadataRoute.Manifest {
  const { data, template, theme } = args
  const background = backgroundFor(template, theme)

  return {
    id: "/",
    name: titleFor(data.profile),
    // Home-screen labels are clipped around 12 characters; the login is the
    // short handle the owner already answers to.
    short_name: data.profile.login,
    description: descriptionFor(data),
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Not locked: a portfolio is a page you read, and a README is easier to
    // read in landscape on anything wider than a phone.
    orientation: "any",
    background_color: background,
    theme_color: background,
    lang: "en",
    dir: "ltr",
    categories: ["personalization", "developer-tools"],
    icons: [
      { src: avatarUrl(data.profile.avatar, 192), sizes: "192x192" },
      { src: avatarUrl(data.profile.avatar, 512), sizes: "512x512" },
    ],
  }
}

/** The brand manifest, for the renderer host and previews — never installable
 * as somebody's portfolio, because it isn't one. */
export function fallbackManifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `Portfolio renderer — ${SITE_NAME}`,
    short_name: "Portfolio",
    description: `Hosted portfolios for ${SITE_NAME} subdomains.`,
    start_url: "/",
    scope: "/",
    display: "browser",
    background_color: DEFAULT_BACKGROUND,
    theme_color: DEFAULT_BACKGROUND,
    lang: "en",
    icons: [
      { src: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}

/**
 * Schema.org `@graph` for the portfolio: the site, the page, the person, and
 * the work. This is what lets a search engine answer "who is <name>" with the
 * owner's own site instead of inferring it from a wall of README prose, and
 * `sameAs` is how it ties this origin to the GitHub account behind it.
 *
 * Emitted only for a claimed subdomain — a preview's `@id`s would name an
 * origin that isn't the subject's.
 */
export function buildJsonLd(args: {
  data: PortfolioData
  origin: string
}): Record<string, unknown> {
  const { data, origin } = args
  const { profile } = data
  const name = displayName(profile)
  const title = titleFor(profile)
  const description = descriptionFor(data)
  const personId = `${origin}/#person`
  const websiteId = `${origin}/#website`

  const person: Record<string, unknown> = {
    "@type": "Person",
    "@id": personId,
    name,
    url: origin,
    // Given an @id so the page's primaryImageOfPage can point at this exact
    // node instead of repeating it — a dangling reference is a validation
    // error, and a second copy is a second entity.
    image: {
      "@type": "ImageObject",
      "@id": `${origin}/#avatar`,
      url: avatarUrl(profile.avatar, 460),
      contentUrl: avatarUrl(profile.avatar, 460),
      width: 460,
      height: 460,
      caption: name,
    },
    description: profile.bio?.trim() || description,
    sameAs: dedupe(profile.links.map((link) => link.href)),
  }
  if (profile.name && profile.name.trim() !== profile.login) {
    person.alternateName = profile.login
  }
  if (profile.location) {
    person.address = {
      "@type": "PostalAddress",
      addressLocality: profile.location,
    }
  }
  if (profile.company) {
    person.worksFor = {
      "@type": "Organization",
      name: profile.company.replace(/^@/, ""),
    }
  }
  const languages = topLanguages(data)
  if (languages.length) person.knowsAbout = languages

  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": websiteId,
      url: origin,
      name: title,
      description,
      inLanguage: "en",
      publisher: { "@id": personId },
    },
    {
      "@type": "ProfilePage",
      "@id": `${origin}/#profilepage`,
      url: origin,
      name: title,
      description,
      isPartOf: { "@id": websiteId },
      about: { "@id": personId },
      mainEntity: { "@id": personId },
      primaryImageOfPage: { "@id": `${origin}/#avatar` },
      inLanguage: "en",
    },
    person,
  ]

  if (data.repos.length) {
    graph.push({
      "@type": "ItemList",
      "@id": `${origin}/#projects`,
      name: `Projects by ${name}`,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      numberOfItems: data.repos.length,
      itemListElement: data.repos.map((repo, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "SoftwareSourceCode",
          name: repo.name,
          url: repo.url,
          codeRepository: repo.url,
          ...(repo.description ? { description: repo.description } : {}),
          ...(repo.language ? { programmingLanguage: repo.language } : {}),
          author: { "@id": personId },
        },
      })),
    })
  }

  return { "@context": "https://schema.org", "@graph": graph }
}

function listSentence(items: string[]): string {
  if (items.length <= 1) return items[0] ?? ""
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

function dedupe(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))]
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const boundary = cut.lastIndexOf(" ")
  return `${(boundary > max * 0.6 ? cut.slice(0, boundary) : cut).trimEnd()}…`
}
