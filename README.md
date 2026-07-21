<div align="center">

<img src="https://raw.githubusercontent.com/is-pinoy-dev/.github/main/assets/banner.gif" alt="is-pinoy.dev banner" width="100%" />

# 🇵🇭 is-pinoy.dev — Ecosystem

**The tooling and infrastructure monorepo behind [is-pinoy.dev](https://is-pinoy.dev).**

A free subdomain service for Filipino developers.

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](https://github.com/is-pinoy-dev/ecosystem/pulls)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Community](https://img.shields.io/badge/community-discord-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.com/channels/1507758007218471062/1507758194624299039)

</div>

---

## 📦 Packages

| Package | Description |
|---------|-------------|
| `packages/cli` | `@is-pinoy-dev/cli` — CLI for validating and syncing DNS records to Cloudflare |
| `packages/registry` | `@is-pinoy-dev/registry` — Core registry logic and Cloudflare provider |
| `packages/schemas` | `@is-pinoy-dev/schemas` — Zod schemas for domain and DNS record validation |
| `packages/ui` | `@is-pinoy-dev/ui` — Shared UI components |
| `packages/eslint-config` | Shared ESLint config |
| `packages/typescript-config` | Shared TypeScript config |

---

## 🖥️ Apps

| App | Description |
|-----|-------------|
| `apps/web` | Public-facing website |

---

## 🚀 Getting Started

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

---

## 🛠️ CLI Usage

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

---

## 🏷️ Badge kit

Building on an is-pinoy.dev subdomain? Wear it. The official badges are
self-contained SVGs served from `badges.is-pinoy.dev` (see
[`packages/badge-kit`](packages/badge-kit)) — pick a theme that suits your
README and paste the snippet.

<p>
  <img src="https://badges.is-pinoy.dev/badge/juan?type=subdomain&theme=light&preview=true" alt="Deployed on is-pinoy.dev" />
  <img src="https://badges.is-pinoy.dev/badge/juan?type=subdomain&theme=dark&preview=true" alt="Deployed on is-pinoy.dev" />
  <img src="https://badges.is-pinoy.dev/badge/juan?type=subdomain&theme=gold&preview=true" alt="Deployed on is-pinoy.dev" />
</p>

```md
[![Deployed on is-pinoy.dev](https://badges.is-pinoy.dev/badge/juan?type=subdomain)](https://juan.is-pinoy.dev)
```

Browse every badge, banner, theme, and format at
**[is-pinoy.dev/badges](https://is-pinoy.dev/badges)**.

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

Please also read our [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

---

<div align="center">

Made with 🤍 by Filipino developers, for Filipino developers.

**[is-pinoy.dev](https://is-pinoy.dev)**

</div>
