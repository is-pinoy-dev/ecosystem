# Contributing

Thanks for your interest in contributing to the is-pinoy.dev ecosystem!

## Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

This is a pnpm monorepo managed with Turborepo. Each package under `packages/` and app under `apps/` is independently buildable.

```
ecosystem/
├── apps/
│   └── web/          # Public website
└── packages/
    ├── cli/          # CLI tool
    ├── registry/     # Core registry and Cloudflare provider
    ├── schemas/      # Zod domain schemas
    └── ui/           # Shared UI components
```

## Development Workflow

1. **Fork** the repository and create a branch from `main`
2. **Make your changes** — keep each PR focused on one thing
3. **Run checks** before opening a PR:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

4. **Open a pull request** with a clear description of what changed and why

## Adding a New Package

1. Create a directory under `packages/<name>/`
2. Add a `package.json` with `"name": "@is-pinoy/<name>"`
3. Extend the shared TypeScript and ESLint configs
4. Add it to `pnpm-workspace.yaml` if needed (it's auto-discovered via the `packages/*` glob)

## Commit Style

Use conventional commits:

```
feat: add new registry command
fix: handle missing CNAME trailing dot
chore: update dependencies
```

## Reporting Issues

Open a GitHub issue with a clear description, steps to reproduce, and relevant logs or error output.
