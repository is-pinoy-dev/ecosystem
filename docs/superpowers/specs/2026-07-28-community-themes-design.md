# Community themes

**Date:** 2026-07-28
**Status:** Draft (design) — not approved, not implemented
**Scope:** A theme authoring/distribution/listing model that lets community
developers ship portfolio themes, and lets any claimed subdomain use one without
redeploying anything. Touches `packages/schemas`, `apps/portfolio`,
`apps/dashboard`, a new `tools/themes` worker, and a new `is-pinoy-dev/themes`
repo. No change to the registry/sync engine or the DNS record model.

## Problem

`apps/portfolio` ships nine templates — three "layout" templates re-colored by
six token themes, and six self-contained "designer" templates. Every one of them
is a `.tsx` file in this monorepo. Adding a tenth means a PR to the platform, a
maintainer review, and a redeploy.

We want community developers to author their own themes, publish them, get
credit for them, and have any subdomain owner pick one — with a gallery that
ranks themes by real usage and appreciation.

## The constraint that shapes everything

A community theme is **third-party code executing on `*.is-pinoy.dev`**.

`apps/portfolio` already treats third-party *content* as hostile: `lib/parse.ts`
sanitizes README HTML, `next.config.mjs` sets a narrow CSP behind it, and
`tests/parse.test.ts` is documented as a release blocker rather than a test
suite. The reasoning in `apps/portfolio/README.md` — "a sanitizer regression here
is stored XSS against every other subdomain" — applies with more force to themes,
for two reasons:

1. **A README is inert markup. A theme is layout logic plus CSS.** It has a
   legitimate reason to emit structure, so "strip everything active" isn't a
   usable answer the way it is for READMEs.
2. **A theme is a supply chain.** One README compromises one portfolio. One
   popular theme, updated once, changes what renders on every subdomain using
   it — simultaneously, with no PR against those subdomains.

`is-pinoy.dev` is also not on the Public Suffix List, so every portfolio is
same-site with `dashboard.is-pinoy.dev`, which holds a `public_repo`-scoped
GitHub OAuth token for every signed-in user (`apps/dashboard/auth.ts`) and has
server actions that spend it to open PRs against the domains repo.

Two things are worth stating precisely, because the loose version ("XSS on a
portfolio steals dashboard sessions") is wrong in a way that misdirects the
mitigations:

- Auth.js cookies are **host-only**, so a sibling subdomain cannot *read* the
  dashboard session. The real cookie attack is **shadowing**: script on a
  portfolio sets `Domain=.is-pinoy.dev` with the session cookie's name, the
  dashboard receives two cookies of that name, and the victim ends up operating
  in an attacker-chosen session. Auth.js's CSRF cookie carries the `__Host-`
  prefix and is immune; the session cookie is `__Secure-`, which does not
  forbid a `Domain` attribute, and is not.
- Next's server actions perform an Origin/Host check, so straightforward CSRF
  into `claimPortfolio` from `evil.is-pinoy.dev` is **already blocked** — it
  does not depend on `SameSite`, which a sibling subdomain would otherwise
  defeat outright.

Independently of themes, moving the session cookie to a `__Host-` prefix closes
the shadowing path for free and should happen regardless of whether this design
ships.

So the design splits into two questions that are usually conflated:

- **Where do themes come from?** (authoring, publishing, versioning, listing)
- **What actually runs?** (the execution model on our origin)

shadcn's registry is an excellent answer to the first. It is not an answer to
the second.

## On shadcn's registry

**Recommendation: adopt it as the publishing format for the highest tier, not as
the runtime.**

A shadcn registry is a static `registry.json` plus per-item JSON documents,
consumed by `npx shadcn add <url>`, which copies source files into the
consumer's project. It is a **build-time source-distribution protocol**. Nothing
in it executes at runtime, and there is no "load this item into a running app"
path — by design.

What it genuinely buys us:

- `cssVars` (`theme` / `light` / `dark`) and a `css` field map almost exactly
  onto our token themes — `app/themes.css` is already this data, hand-written.
- A versioned, machine-readable, independently-hostable manifest per theme. An
  author can host theirs on their own repo or GitHub Pages; we fetch and index it.
- Authors already know the format, and `packages/ui/components.json` already
  puts this repo inside that ecosystem.

What it does not buy us, and what we must build regardless: a gallery, install
and star counts, a safety review gate, version pinning per subdomain, and any
form of runtime availability.

> Verify the exact item schema against ui.shadcn.com before implementing —
> `ui.shadcn.com` is blocked by this environment's network policy, so the field
> list above is from memory and the registry format has moved more than once.

## Decisions

### 1. Three tiers, by expressiveness and by execution model

Not every theme needs to run code, and most don't. Tiering means the common case
is safe by construction and only the rare case needs review.

| | What the author writes | Runtime availability | Review |
|---|---|---|---|
| **T1 — token theme** | CSS custom properties | Immediate, no deploy | Automated |
| **T2 — layout theme** | Block manifest + scoped CSS | Immediate, no deploy | Automated + spot check |
| **T3 — code theme** | React component | Merge to platform, then deploy | Human, mandatory |

**T1 — token themes (data only).** The theme is a set of CSS custom properties
and nothing else. It recolors the existing layout templates. This is exactly what
`app/themes.css` already does: because the tokens cascade as custom properties,
every shadcn utility (`text-primary`, `bg-background`, `border-border`) picks up
the override with no renderer change at all. shadcn `cssVars` is a direct
mapping. A T1 theme is pure data, so it can be fetched and applied at request
time with no code-execution question to answer.

**T2 — layout themes (declarative manifest + scoped CSS).** The theme declares
which blocks render, in what order, with which variant from a fixed set, plus a
stylesheet scoped to the theme root. **The renderer keeps owning the HTML** —
the theme controls order and appearance, never markup — so the sanitizer's
output contract and the DOM around it cannot be altered by a theme.

This tier is viable because of an empirical finding, not a hope: the six
existing designer templates are *already* CSS over a near-identical skeleton.
`concrete.tsx`, `broadsheet.tsx`, and `phosphor.tsx` render the same
header → bio → meta → readme → repo-rows → footer sequence and differ almost
entirely in `app/designer-themes.css`. The DSL is therefore not speculative —
it is a description of what those six files already do. **Porting all six to T2
manifests is how we prove the tier is sufficient**, and gives us six reference
themes on day one.

This requires the renderer to emit a documented, stable set of class hooks (a
*theme contract* — `.pf-name`, `.pf-repo-row`, `.pf-readme`, …), versioned, so
contract changes don't silently break published themes.

**T3 — code themes (React), vendored at build time.** The escape hatch for
designs the DSL can't express. Published as a shadcn registry item — and then
**vendored into this repo by a bot PR**, pinned to a version and a content hash,
into `apps/portfolio/templates/community/<author>__<name>/`. CI enforces a lint
gate (no `fetch`, no `eval`, no `dangerouslySetInnerHTML` beyond the one
sanitized README slot, no runtime dependencies), a human approves, and the
deploy makes it live.

T3's real risk is not the rendered page — it is **CI**. `turbo.json` declares
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` as build environment. Any theme
that executes during install or build — a dependency, a `postinstall` — reads
the zone token and can rewrite DNS for every subdomain in the registry. That is
a whole-registry compromise reached through a theme submission, and it is a
strictly larger blast radius than anything the rendering tiers can produce.
Hence: the vendoring bot copies source only, runs no install scripts, the theme
gets no dependencies of its own, and theme validation runs in a job that has no
Cloudflare credentials in its environment.

Note what "runtime available" then means, and that it is the requirement that
actually matters: **the theme becomes available to every subdomain the moment it
merges, and no subdomain owner has to build or deploy anything to use it.** That
is true in all three tiers. What differs is only whether *we* deploy.

### 2. Rejected: remote code execution at request time

No `eval`, no dynamic `import()` of author-hosted modules, no runtime `<link>`
or `@import` to a third-party stylesheet host.

Runtime-fetched CSS is worth calling out separately, because it looks harmless
and isn't: it means the reviewed artifact and the served artifact are different
things. An author passes review with benign CSS, then changes what is served —
to every subdomain using the theme, retroactively, with no diff anywhere. Every
theme artifact must be **compiled and stored at ingest time, addressed by content
hash, and served from our origin.**

### 3. CSS is not inert, and the allow-list must be positive

T1 and T2 accept author CSS, so the CSS pipeline is a security boundary and
needs the same posture `lib/parse.ts` has:

- `@font-face src` — an exfiltration beacon that reports every visitor's IP, UA
  and timing to the theme author on every render, for every subdomain using the
  theme. **This one is live today**: the CSP sets no `font-src` and no
  `default-src`, so font fetches are unrestricted. Allow a curated self-hosted
  set only.
- `@import` — makes the sheet remotely mutable after review, which is the same
  hole as runtime-fetched CSS (§2). Also unrestricted today, since `style-src`
  is unset. Banned.
- `url()` in image properties — the same beacon, but note this path is *already*
  closed: CSP `img-src` covers CSS `background-image`, and the existing
  four-host allow-list applies. Ban `url()` anyway, so the rule doesn't depend
  on a CSP directive staying narrow.
- Attribute/`:has()` selectors combined with `url()` — classic CSS value
  exfiltration. Falls out of the `url()` ban.
- `position: fixed` full-viewport overlays — the highest-yield attack in the
  whole model. A pure-CSS overlay plus `::before { content }` renders a
  full-page sign-in prompt on a genuine `*.is-pinoy.dev` origin under a genuine
  Universal SSL cert. `frame-ancestors 'none'` and `form-action 'none'` do not
  help — the payload is a *link*, not a form, and the obvious destination is a
  real GitHub OAuth consent screen for the attacker's own app requesting `repo`.
  Needs no JavaScript, so it survives every tier. Banned, and worth a positive
  layout-containment rule rather than a single property ban.

Implementation: parse with PostCSS at ingest, **allow-list** at-rules,
properties, and functions (never blocklist), rewrite every selector to be scoped
under `#pf-root[data-theme="<id>"]`, and store the compiled output. Reject with
a CI comment on the theme's PR, not silently.

This also forces a decision the app has so far deliberately deferred:
`next.config.mjs` sets no `style-src` and no `font-src` at all, documented as
"a half-configured CSP that blanks the page is worse than a narrow one that
holds." Theme CSS is inlined by us from stored artifacts, so it can carry a
hash — `style-src 'self' 'sha256-…'` becomes achievable, and `font-src` should be
pinned at the same time. `tests/csp.test.ts` extends to cover both.

### 4. Version pinning per subdomain

`portfolio.theme` today is an enum string. Community themes need identity plus
version:

```jsonc
// subdomains/juan.json
"portfolio": {
  "template": "minimal",
  "theme": { "id": "@maria/brutal-grid", "version": "1.2.0" }
}
```

The existing string enums stay valid for built-ins — the schema takes a union,
which keeps every existing subdomain file untouched.

Pinning is what contains the supply-chain risk. An author publishing `2.0.0`
does not touch anyone on `1.2.0`; moving is a PR against the subdomain owner's
own JSON, reviewed exactly like every other registry change. The gallery can
surface "an update is available"; it cannot apply one.

### 5. Source of truth: an `is-pinoy-dev/themes` repo

Mirrors the `domains` repo model, which is the house pattern and already has
CI tooling shaped like what we need (`.github/actions/registry-validate`).

The theme source is **not** copied here. The author keeps their own repo and
publishes a shadcn registry; this repo holds one **pointer file** per theme:

```jsonc
// themes/maria-santos/brutal-grid.json
{
  "id": "@maria-santos/brutal-grid",
  "author": { "github": "maria-santos" },
  "license": "MIT",
  "source": {
    "registry": "https://themes.mariasantos.dev/r/brutal-grid.json",
    "version": "1.2.0",
    "integrity": "sha256-…"
  }
}
```

Authors keep ownership and their own release cadence; a new version is a
one-line bump, which is also the review point, since the integrity hash moves
with it. Ingest fetches the URL, verifies the hash, compiles, and
content-addresses the result — so the reviewed artifact and the served artifact
are the same bytes even though the source lives on someone else's host.

The is-pinoy-specific manifest (tier, contract version, block list) rides in the
registry item's `meta` field, which the shadcn format leaves open. One document
therefore serves both consumers: the shadcn CLI reads `files`/`cssVars` for
people vendoring the theme into their own project, our compiler reads `meta`.
That is what makes the shadcn choice load-bearing rather than decorative, and it
means an author with an existing registry adds a `meta` block rather than
adopting a new format.

CI on a theme PR: validate against a new schema in `@is-pinoy-dev/schemas`,
compile the CSS through the allow-list, and **post a live preview link**. That
last part is free — `apps/portfolio` already has `?preview=1&login=…&template=…`,
built for the dashboard's claim flow. Extending it with `&theme=<id>@<version>`
gives every theme PR a real, rendered preview against a real profile with no new
infrastructure.

A worked example of the author-side repo — four files, no build step — is in
[`examples/theme-brutal-grid/`](./examples/theme-brutal-grid/).

**`@is-pinoy-dev/theme-kit`** (proposed, sibling to `badge-kit`): a small CLI
giving authors `dev` and `check` locally. The CSS allow-list is the one
genuinely surprising part of authoring here, and meeting it in CI review rather
than at edit time is the difference between a pleasant format and an annoying
one.

### 6. Listing service: `tools/themes` worker + D1

Copies `tools/status` structurally — React Router 7 SSR on a Worker, D1 for
state, cron for refresh, `[[routes]]` on `themes.is-pinoy.dev`. That worker is
the closest existing analogue and its migration/db layout transfers directly.

Cron: pull the themes repo, refresh GitHub stars for T3 source repos, recompute
installs from the domains repo, write to D1.

Serves:

- the gallery UI — browse, live preview, sort
- `GET /api/themes` — the index
- `GET /api/themes/:id@:version` — the compiled artifact, consumed by
  `apps/portfolio` with the house `revalidate: 3600` pattern, exactly as
  `lib/resolve.ts` consumes the domains repo
- `POST /api/themes/:id/star` — behind the dashboard's existing GitHub OAuth

```sql
CREATE TABLE themes (
  id TEXT PRIMARY KEY,           -- "@maria/brutal-grid"
  author TEXT NOT NULL,
  tier TEXT NOT NULL,            -- token | layout | code
  latest_version TEXT NOT NULL,
  repo_url TEXT,
  published_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE theme_versions (
  id TEXT NOT NULL, version TEXT NOT NULL,
  artifact_hash TEXT NOT NULL,   -- content-addressed compiled output
  compiled TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (id, version)
);
CREATE TABLE theme_stars (       -- one row per GitHub account, unforgeable
  id TEXT NOT NULL, github_user_id TEXT NOT NULL, starred_at TEXT NOT NULL,
  PRIMARY KEY (id, github_user_id)
);
CREATE TABLE theme_stats (       -- recomputed by cron, not incremented
  id TEXT PRIMARY KEY,
  installs INTEGER NOT NULL,     -- live subdomains using it
  stars INTEGER NOT NULL,
  previews_7d INTEGER NOT NULL,
  computed_at TEXT NOT NULL
);
```

### 7. Metrics: installs, not "downloads"

For a runtime-applied theme there is no download. Counting hits on
`/api/themes/:id` counts our own ISR cache misses, not humans, and is trivially
inflatable with a loop. Publishing that number as "downloads" would make the
gallery's primary ranking signal meaningless within a week.

The metrics that are actually sound here:

- **Installs** — count of live subdomains whose JSON references the theme.
  Derived from the domains repo, so it is unforgeable (inflating it means
  getting PRs merged), needs no tracking, and costs one cron pass. This is the
  headline number.
- **Stars** — first-party, auth-gated through the dashboard's existing OAuth,
  one per GitHub account. Measures the theme. Mirroring the author's GitHub repo
  stars instead would measure their *repo*, which for a monorepo of themes or a
  theme inside a bigger project is close to noise — show it as a link, not a
  metric.
- **Previews (7d)** — gallery preview renders, IP-bucketed and deduped daily.
  A soft discovery signal; label it as such.
- **CLI installs** — *if* we also expose a shadcn-compatible registry endpoint
  for people vendoring themes into their own projects, that has a real
  edge-countable download number. Report it separately. Never add it to installs;
  the two count different things.

Rank on a decayed score rather than raw totals, or the first three themes
published win the gallery permanently:

```
score = ln(1 + installs) * 1.0 + ln(1 + stars) * 0.5 + recency_decay(updated_at)
```

## Phasing

Ordered so each phase ships something usable and the risky parts come after the
cheap parts have proven the model.

**P0 — foundations.** Theme-contract class hooks in the renderer (a refactor of
existing templates, no new feature). `style-src` + `font-src` in the CSP with
`tests/csp.test.ts` extended. Theme schema in `@is-pinoy-dev/schemas`, union'd
with the existing enums.

**P1 — T1 token themes, end to end, no new infrastructure.** The themes repo
with CI validation, PR previews via the existing `?preview=` mode, and an index
JSON compiled by CI and read from `raw.githubusercontent.com` — which is exactly
what `lib/resolve.ts` already does for the domains repo. **This is the smallest
version of the whole idea that actually works**, and it needs no worker, no D1,
and no gallery. Ship it first and see whether people author themes at all before
building the rest.

**P2 — `tools/themes` worker + D1 + gallery.** Installs, stars, ranked listing.
The index moves off raw.githubusercontent onto the API.

**P3 — T2 layout themes.** The block DSL and the CSS compiler. Port the six
existing designer templates to manifests as the proof and the seed content.

**P4 — T3 code themes.** The vendoring bot, the lint gate, the human review
path. Last, because P1–P3 will show whether it is needed at all — if the DSL
covers what authors want, T3 is cost with no benefit.

## Open questions

- **Theme contract stability.** Adding a block to `PortfolioData` is additive,
  but renaming a class hook breaks published themes. Contract versioning
  (`contract: 1` in the manifest, renderer supports N and N-1) is the obvious
  answer; whether it's worth the machinery before there are published themes is
  not obvious.
- **Attribution in the rendered page.** A small "theme by @maria" credit in the
  footer is the incentive that makes authoring worthwhile, but it is also markup
  we impose on every portfolio. Not free, probably still correct.
- **Naming.** `@author/name` reads as npm and invites the assumption that it is
  installable from npm. Worth a second look.
- **Moderation.** A theme can pass every automated gate and still render
  something the project doesn't want on its domain. An unpublish path that
  reverts affected subdomains to a built-in needs to exist before P2, not after.
