# Docs Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `apps/docs` with the is-pinoy.dev design system — brand fonts, Jeepney Gold tokens, pixel-grid background, zero border-radius, and logo+banner.gif nav.

**Architecture:** Import `@is-pinoy-dev/ui/globals.css` as the CSS token source, override fumadocs' `--color-fd-*` variables to map to design tokens, and use fumadocs' `nav.title` JSX slot for the logo/banner. The home page (`/`) redirects to the first doc via a depth-first traversal of the fumadocs page tree.

**Tech Stack:** Next.js 16 App Router, fumadocs-ui 16, Tailwind CSS v4, `@is-pinoy-dev/ui` workspace package, `next/font/google` (Press Start 2P, IBM Plex Sans, IBM Plex Mono), `fumadocs-core/page-tree`

---

### Task 1: Add `@is-pinoy-dev/ui` dependency and update postcss

**Files:**
- Modify: `apps/docs/package.json`
- Modify: `apps/docs/postcss.config.mjs`

- [ ] **Step 1: Add workspace dep to package.json**

In `apps/docs/package.json`, add to `devDependencies`:
```json
"@is-pinoy-dev/ui": "workspace:*",
```
Full devDependencies block after change:
```json
"devDependencies": {
  "@is-pinoy-dev/ui": "workspace:*",
  "@workspace/eslint-config": "workspace:*",
  "@workspace/typescript-config": "workspace:*",
  "@tailwindcss/postcss": "^4.3.0",
  "@types/mdx": "^2.0.13",
  "@types/node": "^25.8.0",
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3",
  "postcss": "^8.5.14",
  "tailwindcss": "^4.3.0",
  "typescript": "^6.0.3",
  "@types/hast": "^3.0.4"
}
```

- [ ] **Step 2: Update postcss.config.mjs to re-export from ui package**

Replace the entire contents of `apps/docs/postcss.config.mjs`:
```js
export { default } from "@is-pinoy-dev/ui/postcss.config";
```

- [ ] **Step 3: Install**

Run from monorepo root (`/home/junbosque/IsPinoyDev/ecosystem`):
```bash
pnpm install
```
Expected: `Done in X.Xs` with no errors.

- [ ] **Step 4: Verify types still pass**

Run from `apps/docs`:
```bash
pnpm types:check
```
Expected: `✓ Types generated successfully`

- [ ] **Step 5: Commit**

```bash
git add apps/docs/package.json apps/docs/postcss.config.mjs pnpm-lock.yaml
git commit -m "feat(docs): add @is-pinoy-dev/ui dep and update postcss config"
```

---

### Task 2: Copy brand assets to docs public directory

**Files:**
- Create: `apps/docs/public/logo.png`
- Create: `apps/docs/public/banner.gif`

- [ ] **Step 1: Copy assets from apps/web/public**

```bash
cp /home/junbosque/IsPinoyDev/ecosystem/apps/web/public/logo.png \
   /home/junbosque/IsPinoyDev/ecosystem/apps/docs/public/logo.png

cp /home/junbosque/IsPinoyDev/ecosystem/apps/web/public/banner.gif \
   /home/junbosque/IsPinoyDev/ecosystem/apps/docs/public/banner.gif
```

- [ ] **Step 2: Verify files exist**

```bash
ls -lh /home/junbosque/IsPinoyDev/ecosystem/apps/docs/public/
```
Expected: `banner.gif` and `logo.png` listed.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/public/logo.png apps/docs/public/banner.gif
git commit -m "feat(docs): add logo and banner assets"
```

---

### Task 3: Update root layout — brand fonts and dark class

**Files:**
- Modify: `apps/docs/src/app/layout.tsx`

Current file (`apps/docs/src/app/layout.tsx`):
```tsx
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 1: Replace layout.tsx with brand fonts**

Write the full new contents of `apps/docs/src/app/layout.tsx`:
```tsx
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Press_Start_2P, IBM_Plex_Sans, IBM_Plex_Mono } from 'next/font/google';

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
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-mono',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`dark ${pixelFont.variable} ${sansFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Verify types pass**

```bash
pnpm types:check
```
Expected: `✓ Types generated successfully`

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/app/layout.tsx
git commit -m "feat(docs): replace Inter with brand fonts, set dark class"
```

---

### Task 4: Restyle global.css — design tokens, fumadocs overrides, pixel grid

**Files:**
- Modify: `apps/docs/src/app/global.css`

- [ ] **Step 1: Replace global.css**

Write the full new contents of `apps/docs/src/app/global.css`:
```css
@import '@is-pinoy-dev/ui/globals.css';
@import 'fumadocs-ui/css/neutral.css';
@import 'fumadocs-ui/css/preset.css';

/* Map fumadocs color tokens to the is-pinoy.dev design system */
:root {
  --color-fd-background: var(--background);
  --color-fd-foreground: var(--foreground);
  --color-fd-card: var(--card);
  --color-fd-card-foreground: var(--card-foreground);
  --color-fd-border: var(--border);
  --color-fd-primary: var(--primary);
  --color-fd-primary-foreground: var(--primary-foreground);
  --color-fd-muted: var(--muted);
  --color-fd-muted-foreground: var(--muted-foreground);
  --color-fd-secondary: var(--secondary);
  --color-fd-secondary-foreground: var(--secondary-foreground);
  --color-fd-accent: var(--accent);
  --color-fd-accent-foreground: var(--accent-foreground);
  --color-fd-popover: var(--popover);
  --color-fd-popover-foreground: var(--popover-foreground);
  --color-fd-ring: var(--ring);
}

/* Pixel-grid background — matches apps/web */
body {
  background-image:
    linear-gradient(rgba(245, 200, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245, 200, 0, 0.03) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Zero border-radius everywhere — design system constraint */
* {
  border-radius: 0 !important;
}

/* Gold bottom border on fumadocs nav bar */
#nd-nav {
  border-bottom: 3px solid #F5C800;
}

/* Scrollbar and scroll-lock fixes */
html {
  scrollbar-gutter: stable;
}

html > body[data-scroll-locked] {
  margin-right: 0px !important;
  --removed-body-scroll-bar-size: 0px !important;
}
```

- [ ] **Step 2: Verify types pass**

```bash
pnpm types:check
```
Expected: `✓ Types generated successfully`

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/app/global.css
git commit -m "feat(docs): apply design system tokens and fumadocs variable overrides"
```

---

### Task 5: Update nav — logo + banner.gif

**Files:**
- Modify: `apps/docs/src/lib/layout.shared.tsx`

- [ ] **Step 1: Replace layout.shared.tsx with logo/banner nav title**

Write the full new contents of `apps/docs/src/lib/layout.shared.tsx`:
```tsx
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';
import { gitConfig } from './shared';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/logo.png"
            alt="is-pinoy.dev logo"
            width={48}
            height={48}
            className="h-10 w-auto [image-rendering:pixelated]"
          />
          <Image
            src="/banner.gif"
            alt="is-pinoy.dev"
            width={200}
            height={40}
            unoptimized
            className="-ml-4 hidden h-9 w-auto md:block"
          />
        </>
      ),
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  };
}
```

Note: `appName` import is removed since the title is now JSX. If `appName` is used elsewhere, it stays in `shared.ts` untouched.

- [ ] **Step 2: Verify types pass**

```bash
pnpm types:check
```
Expected: `✓ Types generated successfully`

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/lib/layout.shared.tsx
git commit -m "feat(docs): replace text nav title with logo and banner.gif"
```

---

### Task 6: Replace home page with first-doc redirect

**Files:**
- Modify: `apps/docs/src/app/(docs)/page.tsx`

The fumadocs page tree node types (from `fumadocs-core/page-tree`):
- `Root` — has `children: Node[]`
- `Node = Item | Separator | Folder`
- `Item` — `type: 'page'`, has `url: string`
- `Folder` — `type: 'folder'`, has `children: Node[]` and optional `index: Item`

The redirect logic does a depth-first walk: check folder index first, then recurse into folder children, skip separators.

- [ ] **Step 1: Replace (docs)/page.tsx with redirect logic**

Write the full new contents of `apps/docs/src/app/(docs)/page.tsx`:
```tsx
import { source } from '@/lib/source';
import { redirect } from 'next/navigation';
import type { Node } from 'fumadocs-core/page-tree';

function findFirstUrl(nodes: Node[]): string | undefined {
  for (const node of nodes) {
    if (node.type === 'page') return node.url;
    if (node.type === 'folder') {
      if (node.index) return node.index.url;
      const url = findFirstUrl(node.children);
      if (url) return url;
    }
  }
}

export default function HomePage() {
  const url = findFirstUrl(source.pageTree.children);
  redirect(url ?? '/');
}
```

- [ ] **Step 2: Verify types pass**

```bash
pnpm types:check
```
Expected: `✓ Types generated successfully`

- [ ] **Step 3: Commit**

```bash
git add "apps/docs/src/app/(docs)/page.tsx"
git commit -m "feat(docs): redirect home to first doc page"
```

---

### Task 7: Smoke-test in dev server

- [ ] **Step 1: Start dev server**

```bash
pnpm dev
```
Expected: server starts on `http://localhost:3000` with no build errors.

- [ ] **Step 2: Verify redirect**

Open `http://localhost:3000` — it should immediately redirect to the first doc page (e.g. `/getting-started` or whatever the first content page is).

- [ ] **Step 3: Verify nav**

The nav bar should show `logo.png` (pixel-art logo, 40px tall) beside `banner.gif` (hidden on mobile, visible at `md` breakpoint). There should be a 3px Jeepney Gold bottom border on the nav.

- [ ] **Step 4: Verify design tokens**

Background should be near-black `#0D0D0D` with a faint gold pixel grid. Sidebar backgrounds should be `#2A2A2A`. Active sidebar items should use `#F5C800`. All corners should be sharp (zero border-radius). Font in headings should be Press Start 2P; body text IBM Plex Sans.

- [ ] **Step 5: Final commit if any fixups were made**

```bash
git add -p
git commit -m "fix(docs): design token fixups from smoke test"
```
(Only if there are fixups — skip if everything looks correct.)
