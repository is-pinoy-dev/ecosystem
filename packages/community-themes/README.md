# @is-pinoy-dev/community-themes

Schema, validator, and compiler for community portfolio themes.

Shared by both ends of the pipeline so there is exactly one definition of what a
valid theme is:

- **`is-pinoy-dev/community` CI** compiles each submitted theme on its PR and
  posts the errors as review feedback.
- **`apps/portfolio`** consumes the compiled output at render time.

Design: [`docs/superpowers/specs/2026-07-28-community-themes-design.md`](../../docs/superpowers/specs/2026-07-28-community-themes-design.md).

## Scope

This package implements **T1 token themes** — a theme is a set of color tokens
and nothing else. Layout themes (T2) and code themes (T3) are later phases.

```ts
import { compileTheme } from "@is-pinoy-dev/community-themes"

const result = compileTheme({
  id: "@maria-santos/brutal-grid",
  version: "1.2.0",
  title: "Brutal Grid",
  author: { github: "maria-santos" },
  license: "MIT",
  base: "light",
  tokens: { background: "#e8e8e6", foreground: "#0a0a0a" },
})

if (result.ok) {
  result.theme.css   // '[data-community-theme="@maria-santos/brutal-grid"] { … }'
  result.theme.hash  // sha256 of the CSS
} else {
  result.errors      // [{ path: "tokens.background", message: "…" }]
}
```

## Why a token is only ever a color

The tempting summary of this tier is "themes are just data". They are not, and
the difference is the whole reason this package exists.

A CSS custom property's value is arbitrary CSS *text*. A theme file that looks
like a JSON object full of hex codes can carry a declaration-block escape:

```json
{ "background": "red; } #pf-root::before { content: ''; position: fixed; inset: 0 } .x {" }
```

which buys the author a full-page overlay on a genuine `*.is-pinoy.dev` origin,
under a genuine certificate — a phishing surface that needs no JavaScript and so
survives every script restriction in the CSP.

Two structural properties contain that, neither of which depends on getting a
regex exactly right:

1. **Values are re-serialized, never interpolated.** Output is built from a
   token name checked against a fixed list and a value `parseColor` has already
   reduced to one of a few known forms. No input string reaches the output
   unexamined.
2. **Scoping is applied, not requested.** Authors write no selectors, so they
   cannot fail to scope one. The compiler emits exactly one rule.

`src/tests/color.test.ts` is the gate for this, in the same sense as
`apps/portfolio/tests/parse.test.ts`: treat a failure as a release blocker, and
add a case for a new vector before changing `color.ts`.

## What a theme may set

The 18 tokens in `src/tokens.ts`, derived from what the built-in themes in
`apps/portfolio/app/themes.css` actually override. Deliberately excluded, per
`DESIGN.md`:

| Excluded | Why |
| --- | --- |
| `--destructive`, `--success`, `--warning` | Semantic, "never decorative" — a theme repainting these could make a failure look like a success |
| `--radius` | Stays `0` across the design system |
| `--font-family-*` | Would reintroduce web fonts, which `font-src 'self'` exists to prevent |

## Tests

```bash
pnpm --filter @is-pinoy-dev/community-themes test
```
