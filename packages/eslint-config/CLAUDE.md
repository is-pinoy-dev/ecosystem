# CLAUDE.md — packages/eslint-config

Guidance for working in `@workspace/eslint-config` specifically. See the root
`CLAUDE.md` for monorepo-wide commands and conventions.

## What this is

`@workspace/eslint-config` — shared ESLint 9 flat-config rules for the
monorepo, exported as three entry points:

```
@workspace/eslint-config/base           base.js  — generic TS rules
@workspace/eslint-config/next-js        next.js  — adds Next.js + React rules
@workspace/eslint-config/react-internal react-internal.js — for internal React libs (e.g. packages/ui)
```

No build step, no tests — this is config, not runtime code.

## Key notes

- A change here affects **every** package and app that extends it — run
  `pnpm lint` at the repo root (not just in one package) after editing a rule
  here to see the full blast radius before committing.
- `next.js` and `react-internal.js` both build on `base.js` — keep
  Next.js-specific or React-specific rules out of `base.js` so packages with
  no UI (e.g. `registry`, `schemas`, `status`) don't inherit rules that don't
  apply to them.
- Prefer adjusting a rule here over disabling it inline (`// eslint-disable`)
  in a consuming package, unless the exception is genuinely local to that one
  file.
