# CLAUDE.md — packages/typescript-config

Guidance for working in `@workspace/typescript-config` specifically. See the
root `CLAUDE.md` for monorepo-wide commands and conventions.

## What this is

`@workspace/typescript-config` — shared `tsconfig.json` base files that every
app and package in the monorepo extends. No build step, no tests — this is
config, not runtime code.

## Key notes

- A change here affects every package's type checking — after editing a base
  config, run `pnpm typecheck` at the repo root, not just in one package, to
  see the full blast radius before committing.
- Keep target/module settings aligned with the root `CLAUDE.md` stated
  runtime: Node 22, TypeScript 5.9, ESM throughout. If an app or package needs
  a genuine exception (e.g. a Cloudflare Workers target under `tools/`),
  override it in that package's own `tsconfig.json` rather than loosening the
  shared base.
