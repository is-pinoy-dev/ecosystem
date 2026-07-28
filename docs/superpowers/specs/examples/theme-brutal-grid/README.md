# Sample community theme — as a standalone repo

An illustrative worked example for
[`../../2026-07-28-community-themes-design.md`](../../2026-07-28-community-themes-design.md).
Nothing here is wired up; it exists so the authoring experience can be reviewed
before any of it is built.

This models what a community developer's **own repository** looks like —
`github.com/maria-santos/theme-brutal-grid`, published at
`themes.mariasantos.dev`. It is not part of this monorepo and never needs to be.

## Repo layout

```
theme-brutal-grid/
├── registry.json          # shadcn registry index
├── r/
│   └── brutal-grid.json   # the theme — a shadcn registry item
├── theme.css              # scoped styles, contract v1
├── preview.webp           # gallery card image, 1200x630
└── README.md
```

Four files. No build step, no dependencies, no framework — a theme in the
token or layout tier is data plus a stylesheet.

## One file, two consumers

`r/brutal-grid.json` is a **valid shadcn registry item**, so it already works
with the standard CLI for anyone vendoring it into their own Next.js project:

```bash
npx shadcn@latest add https://themes.mariasantos.dev/r/brutal-grid.json
```

The is-pinoy.dev-specific part — which blocks render, in what order, with which
variants — rides in the item's `meta.isPinoyDev` field, which the registry
format leaves open for exactly this. So the same document serves both paths:
the shadcn CLI reads `files` and `cssVars` and ignores `meta`; our ingest
compiler reads `meta` and `cssVars` and compiles `files`.

That is what makes the shadcn choice load-bearing rather than decorative. It
also means an author with an existing shadcn registry adds one `meta` block
rather than adopting a new format.

## Publishing: the author keeps their repo

Registration is a **single pointer file** in `is-pinoy-dev/themes` — the theme
source itself never gets copied there:

```jsonc
// themes/maria-santos/brutal-grid.json
{
  "id": "@maria-santos/brutal-grid",
  "author": { "github": "maria-santos" },
  "license": "MIT",
  "source": {
    "registry": "https://themes.mariasantos.dev/r/brutal-grid.json",
    "version": "1.2.0",
    "integrity": "sha256-Ux9m2K1oQpV7Zbn0aE4rT8s3lJcW6dYf1gH5kM2nR0s="
  }
}
```

On PR, CI fetches that URL, verifies the hash, compiles the CSS through the
allow-list, renders a preview, and posts the result as a comment. Shipping
`1.3.0` is a one-line bump to this file — which is also the review point, since
the integrity hash changes with it.

Nobody using `1.2.0` moves until they change their own subdomain file. That
pinning is what keeps a theme update from being a push to N sites at once.

## Consuming it

```jsonc
// is-pinoy-dev/domains — subdomains/juan.json
{
  "subdomain": "juan",
  "owner": { "github": "juan-dev" },
  "records": {
    "CNAME": { "content": "portfolio.is-pinoy.dev", "proxied": true }
  },
  "portfolio": {
    "template": "minimal",
    "theme": { "id": "@maria-santos/brutal-grid", "version": "1.2.0" }
  }
}
```

## The authoring loop

The renderer's existing preview mode is the whole feedback loop — it already
takes a GitHub login and renders a real profile, so a theme author develops
against real content from the first minute:

```
https://portfolio.is-pinoy.dev/?preview=1&github=maria-santos&theme=@maria-santos/brutal-grid@1.2.0
```

Locally, a small `@is-pinoy-dev/theme-kit` CLI (proposed — sibling to the
existing `badge-kit`) would run the same compile and preview against a local
file, so the loop is edit-save-refresh with no PR:

```bash
npx @is-pinoy-dev/theme-kit dev --login maria-santos
npx @is-pinoy-dev/theme-kit check      # same allow-list CI runs
```

Shipping `check` as a local command matters more than it looks: the CSS
restrictions are the one genuinely surprising part of authoring here, and
finding out about them in CI review rather than at edit time is the difference
between a pleasant format and an annoying one.

## The contract

`theme.css` styles a documented, versioned set of class hooks (`.pf-name`,
`.pf-repo`, `.pf-readme`, …) emitted by the renderer. The theme controls
appearance and block order; the renderer keeps ownership of the markup, so the
README sanitizer's output contract cannot be altered by a theme.

`contract: 1` in the manifest pins which set of hooks the theme was written
against.
