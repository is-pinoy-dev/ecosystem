# SEO & Metadata Fix — apps/docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix structured data, PWA manifest, branded OG image, and metadata in `apps/docs`.

**Architecture:** Five independent file changes — shared constant first, then manifest, layout, page, and OG route. No new dependencies required; `next/og` and `ImageResponse` are already available.

**Tech Stack:** Next.js 16 App Router, TypeScript, `next/og` (Satori), fumadocs-ui, Google Fonts via fetch

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/docs/src/lib/shared.ts` | Modify | Add `baseUrl` constant — single source of truth for prod URL |
| `apps/docs/public/site.webmanifest` | Modify | Fix name, colours, start_url, icon purposes |
| `apps/docs/src/app/layout.tsx` | Modify | Replace Organization schema → WebSite; add viewport export; add keywords/category/creator |
| `apps/docs/src/app/(docs)/[[...slug]]/page.tsx` | Modify | Enhance TechArticle schema; explicit OG title/description; use baseUrl |
| `apps/docs/src/app/og/docs/[...slug]/route.tsx` | Modify | Custom branded ImageResponse replacing DefaultImage |

---

## Task 1: Add `baseUrl` to shared.ts

**Files:**
- Modify: `apps/docs/src/lib/shared.ts`

- [ ] **Step 1: Add the constant**

Open `apps/docs/src/lib/shared.ts`. The file currently reads:

```ts
export const appName = 'is-pinoy.dev';
export const docsRoute = '/';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'is-pinoy-dev',
  repo: 'ecosystem',
  branch: 'main',
};
```

Replace the entire file with:

```ts
export const appName = 'is-pinoy.dev';
export const baseUrl = 'https://docs.is-pinoy.dev';
export const docsRoute = '/';
export const docsImageRoute = '/og/docs';
export const docsContentRoute = '/llms.mdx/docs';

export const gitConfig = {
  user: 'is-pinoy-dev',
  repo: 'ecosystem',
  branch: 'main',
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/docs/src/lib/shared.ts
git commit -m "chore(docs): add baseUrl to shared constants"
```

---

## Task 2: Fix PWA Manifest

**Files:**
- Modify: `apps/docs/public/site.webmanifest`

- [ ] **Step 1: Replace manifest content**

Replace the entire `apps/docs/public/site.webmanifest` with:

```json
{
  "name": "is-pinoy.dev Docs",
  "short_name": "ipd docs",
  "description": "Documentation for the is-pinoy.dev free subdomain service",
  "start_url": "/guides",
  "scope": "/",
  "display": "standalone",
  "theme_color": "#F5C800",
  "background_color": "#0D0D0D",
  "icons": [
    {
      "src": "/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/web-app-manifest-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/web-app-manifest-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/docs/public/site.webmanifest
git commit -m "fix(docs): update PWA manifest — name, theme colour, start_url, icon purposes"
```

---

## Task 3: Update Root Layout — Schema, Viewport, Metadata

**Files:**
- Modify: `apps/docs/src/app/layout.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire `apps/docs/src/app/layout.tsx` with:

```tsx
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Press_Start_2P, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';
import type { Metadata, Viewport } from 'next';

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
});

const sansFont = IBM_Plex_Sans({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-sans',
});

const monoFont = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
});

export const viewport: Viewport = {
  themeColor: '#F5C800',
  colorScheme: 'dark',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.is-pinoy.dev'),
  title: {
    template: '%s | is-pinoy.dev docs',
    default: 'is-pinoy.dev docs',
  },
  description: 'Documentation for the is-pinoy.dev ecosystem.',
  keywords: ['Filipino developers', 'free subdomain', 'is-pinoy.dev', 'portfolio subdomain', 'Pilipinas'],
  category: 'technology',
  creator: 'is-pinoy.dev',
  openGraph: {
    siteName: 'is-pinoy.dev docs',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'is-pinoy.dev docs',
  url: 'https://docs.is-pinoy.dev',
  isPartOf: {
    '@type': 'Organization',
    name: 'is-pinoy.dev',
    url: 'https://is-pinoy.dev',
    sameAs: [
      'https://is-pinoy.dev',
      'https://github.com/is-pinoy-dev/ecosystem',
      'https://discord.gg/MVrgEfFExh',
    ],
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`flex flex-col min-h-screen ${pixelFont.variable} ${sansFont.variable} ${monoFont.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm --filter docs typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/app/layout.tsx
git commit -m "fix(docs): replace Organization schema with WebSite; add viewport, keywords"
```

---

## Task 4: Update Page — TechArticle Schema + OG Metadata

**Files:**
- Modify: `apps/docs/src/app/(docs)/[[...slug]]/page.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire `apps/docs/src/app/(docs)/[[...slug]]/page.tsx` with:

```tsx
/** biome-ignore-all lint/security/noDangerouslySetInnerHtml: <explanation> */
import { getPageImage, getPageMarkdownUrl, source } from "@/lib/source"
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page"
import { notFound } from "next/navigation"
import { getMDXComponents } from "@/components/mdx"
import type { Metadata } from "next"
import { createRelativeLink } from "fumadocs-ui/mdx"
import { baseUrl, gitConfig } from "@/lib/shared"

const org = { '@type': 'Organization', name: 'is-pinoy.dev', url: 'https://is-pinoy.dev' } as const;

function buildSchemas(page: ReturnType<typeof source.getPage> & object) {
  const breadcrumbItems = [
    { name: "Docs", url: baseUrl },
    ...page.slugs.map((_, i) => ({
      name:
        i === page.slugs.length - 1
          ? page.data.title
          : (page.slugs[i] ?? "")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
      url: `${baseUrl}/${page.slugs.slice(0, i + 1).join("/")}`,
    })),
  ]

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: page.data.title,
    description: page.data.description,
    url: `${baseUrl}${page.url}`,
    author: org,
    publisher: org,
    isPartOf: { "@type": "WebSite", name: "is-pinoy.dev docs", url: baseUrl },
  }

  return { breadcrumbSchema, articleSchema }
}

export default async function Page(props: PageProps<"/[[...slug]]">) {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  const MDX = page.data.body
  const markdownUrl = getPageMarkdownUrl(page).url
  const { breadcrumbSchema, articleSchema } = buildSchemas(page)

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription className="mb-0">
        {page.data.description}
      </DocsDescription>
      <div className="flex flex-row items-center gap-2 border-b pb-6">
        <MarkdownCopyButton markdownUrl={markdownUrl} />
        <ViewOptionsPopover
          markdownUrl={markdownUrl}
          githubUrl={`https://github.com/${gitConfig.user}/${gitConfig.repo}/blob/${gitConfig.branch}/content/docs/${page.path}`}
        />
      </div>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  )
}

export async function generateStaticParams() {
  return source.generateParams()
}

export async function generateMetadata(
  props: PageProps<"/[[...slug]]">
): Promise<Metadata> {
  const params = await props.params
  const page = source.getPage(params.slug)
  if (!page) notFound()

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: `${baseUrl}${page.url}`,
    },
    openGraph: {
      title: page.data.title,
      description: page.data.description,
      url: `${baseUrl}${page.url}`,
      type: "article",
      images: getPageImage(page).url,
    },
    twitter: {
      card: "summary_large_image",
    },
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
pnpm --filter docs typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/app/(docs)/[[...slug]]/page.tsx
git commit -m "fix(docs): enhance TechArticle schema; explicit OG metadata; use baseUrl"
```

---

## Task 5: Custom Branded OG Image

**Files:**
- Modify: `apps/docs/src/app/og/docs/[...slug]/route.tsx`

- [ ] **Step 1: Replace the file**

Replace the entire `apps/docs/src/app/og/docs/[...slug]/route.tsx` with:

```tsx
import { getPageImage, source } from '@/lib/source';
import { baseUrl } from '@/lib/shared';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';

export const revalidate = false;

async function loadFont(family: string, weight = 400): Promise<ArrayBuffer> {
  const params = new URLSearchParams({ family: `${family}:wght@${weight}`, display: 'swap' });
  const css = await fetch(`https://fonts.googleapis.com/css2?${params}`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36',
    },
  }).then((r) => r.text());
  const url = css.match(/src: url\((.+?)\)/)?.[1];
  if (!url) throw new Error(`Could not find font URL for ${family} ${weight}`);
  return fetch(url).then((r) => r.arrayBuffer());
}

export async function GET(_req: Request, { params }: RouteContext<'/og/docs/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  const [pressStart2PData, ibmPlexMonoData] = await Promise.all([
    loadFont('Press+Start+2P'),
    loadFont('IBM+Plex+Mono'),
  ]);

  const title = page.data.title;
  const description = page.data.description
    ? page.data.description.length > 120
      ? `${page.data.description.slice(0, 120)}…`
      : page.data.description
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          backgroundColor: '#0D0D0D',
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 3px)',
          position: 'relative',
        }}
      >
        {/* Right gold accent bar */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: 6,
            height: '100%',
            backgroundColor: '#F5C800',
          }}
        />
        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 80px 48px 64px',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Top label */}
          <span
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: 16,
              color: '#888888',
              letterSpacing: '0.05em',
            }}
          >
            is-pinoy.dev docs
          </span>

          {/* Center: title + description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <span
              style={{
                fontFamily: 'Press Start 2P',
                fontSize: 38,
                color: '#F5C800',
                lineHeight: 1.5,
                maxWidth: 900,
              }}
            >
              {title}
            </span>
            {description && (
              <span
                style={{
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 20,
                  color: '#FAFAF5',
                  lineHeight: 1.5,
                  maxWidth: 900,
                }}
              >
                {description}
              </span>
            )}
          </div>

          {/* Bottom: domain */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span
              style={{
                fontFamily: 'IBM Plex Mono',
                fontSize: 16,
                color: '#888888',
                letterSpacing: '0.05em',
              }}
            >
              {baseUrl.replace('https://', '')}
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Press Start 2P', data: pressStart2PData, weight: 400, style: 'normal' },
        { name: 'IBM Plex Mono', data: ibmPlexMonoData, weight: 400, style: 'normal' },
      ],
    },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImage(page).segments,
  }));
}
```

- [ ] **Step 2: Build the docs app to verify OG generation works**

```bash
pnpm --filter docs build
```

Expected: build completes with no errors. OG routes will appear in the output as `● /og/docs/[...slug]`.

- [ ] **Step 3: Spot-check an OG image in dev**

```bash
pnpm --filter docs dev
```

Open `http://localhost:3001/og/docs/guides/image.png` in the browser (adjust port if needed). Expected: dark background, gold pixel title text, IBM Plex Mono description, scanlines visible, gold right bar.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src/app/og/docs/[...slug]/route.tsx
git commit -m "feat(docs): custom branded OG image — dark bg, gold pixel font, scanlines"
```

---

## Task 6: Final Build Verification

- [ ] **Step 1: Full build + typecheck**

```bash
pnpm --filter docs typecheck && pnpm --filter docs build
```

Expected: typecheck passes with no errors, build completes successfully.

- [ ] **Step 2: Verify manifest is valid JSON and correct**

```bash
cat apps/docs/public/site.webmanifest | node -e "const d = require('fs').readFileSync('/dev/stdin','utf8'); const m = JSON.parse(d); console.log('name:', m.name, '| start_url:', m.start_url, '| theme_color:', m.theme_color, '| icons:', m.icons.length)"
```

Expected output:
```
name: is-pinoy.dev Docs | start_url: /guides | theme_color: #F5C800 | icons: 4
```

- [ ] **Step 3: Verify JSON-LD schemas in built output**

```bash
grep -r '"@type":"WebSite"' apps/docs/.next/server/app 2>/dev/null | head -3
grep -r '"@type":"TechArticle"' apps/docs/.next/server/app 2>/dev/null | head -3
```

Expected: matches found in the built HTML.
