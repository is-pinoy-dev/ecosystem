# is-pinoy.dev ecosystem

The tooling and infrastructure monorepo behind [is-pinoy.dev](https://is-pinoy.dev) — a free subdomain service for Filipino developers.

## Packages

| Package | Description |
|---------|-------------|
| `packages/cli` | `@is-pinoy-dev/cli` — CLI for validating and syncing DNS records to Cloudflare |
| `packages/registry` | `@is-pinoy-dev/registry` — Core registry logic and Cloudflare provider |
| `packages/schemas` | `@is-pinoy-dev/schemas` — Zod schemas for domain and DNS record validation |
| `packages/ui` | `@is-pinoy-dev/ui` — Shared UI components |
| `packages/eslint-config` | Shared ESLint config |
| `packages/typescript-config` | Shared TypeScript config |

## Apps

| App | Description |
|-----|-------------|
| `apps/web` | Public-facing website |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) 22+
- [pnpm](https://pnpm.io) 10+

### Install dependencies

```bash
pnpm install
```

### Build all packages

```bash
pnpm build
```

### Run the CLI

```bash
# From the repo root
node packages/cli/dist/index.js --help
```

## CLI Usage

The CLI manages DNS records in the [is-pinoy.dev domains](https://github.com/is-pinoy-dev/domains) repository.

```bash
# Validate domain JSON files
is-pinoy registry validate --dir ./subdomains

# Show diff between local files and Cloudflare
is-pinoy registry diff --dir ./subdomains

# Sync changes to Cloudflare
is-pinoy registry sync --dir ./subdomains
```

Environment variables (or use `--dotenv` to load a `.env` file):

```
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
