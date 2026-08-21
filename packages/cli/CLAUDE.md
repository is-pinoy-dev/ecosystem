# CLAUDE.md — packages/cli

Guidance for working in `@is-pinoy-dev/cli` specifically. See the root
`CLAUDE.md` for monorepo-wide commands and conventions.

## What this is

`@is-pinoy-dev/cli` — the published `is-pinoy` CLI (Commander.js) for
validating and syncing subdomain registry files against Cloudflare DNS.
Published to npm with `access: public` via Changesets on merge to `main`.

## Commands

```bash
pnpm --filter @is-pinoy-dev/cli build       # tsup, ESM, Node22 target
pnpm --filter @is-pinoy-dev/cli typecheck
pnpm --filter @is-pinoy-dev/cli lint
pnpm --filter @is-pinoy-dev/cli test
pnpm --filter @is-pinoy-dev/cli test -- validate.test.ts
pnpm --filter @is-pinoy-dev/cli test:watch
```

## Architecture

- **CLI → Registry pattern:** commands in `src/commands/` call
  `import("@is-pinoy-dev/registry")` dynamically at runtime, never a static
  top-level import. The registry package owns all Cloudflare API interaction;
  this package only handles argument parsing, confirmation prompts, and output
  formatting (`src/utils/`).
- Commands: `registry validate`, `registry diff`, `registry sync` (supports
  `--yes` and `--dry-run`), `registry status`. See `README.md` for full usage
  and the subdomain JSON file format.
- `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ZONE_ID` are required for `diff`,
  `sync`, and `status` (not `validate`) — loadable via `--dotenv <path>`.

## Key notes

- Depends on `@is-pinoy-dev/registry` as a workspace `devDependency` — bundled
  into `dist/` at build time via `tsup`, so registry changes require a
  `pnpm --filter @is-pinoy-dev/cli build` (or root `pnpm build`, which respects
  Turborepo's dependency order) to show up in the CLI output.
- Don't add new I/O, prompts, or formatting logic to the registry package —
  that belongs here.
