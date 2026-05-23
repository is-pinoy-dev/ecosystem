# @is-pinoy-dev/cli

CLI for managing [is-pinoy.dev](https://is-pinoy.dev) subdomains — validate JSON files locally and sync DNS records to Cloudflare.

## Installation

```bash
npm install -g @is-pinoy-dev/cli
```

> Requires authentication to GitHub Packages. Add this to your `~/.npmrc`:
>
> ```
> @is-pinoy-dev:registry=https://npm.pkg.github.com
> //npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
> ```

## Commands

### `registry validate`

Validate subdomain JSON files against the schema.

```bash
is-pinoy registry validate --dir ./subdomains
```

### `registry diff`

Show what changes would be applied to Cloudflare without making any changes.

```bash
is-pinoy registry diff --dir ./subdomains
```

### `registry sync`

Apply changes to Cloudflare DNS.

```bash
is-pinoy registry sync --dir ./subdomains

# Skip confirmation prompt
is-pinoy registry sync --dir ./subdomains --yes

# Preview only, no changes applied
is-pinoy registry sync --dir ./subdomains --dry-run
```

### `registry status`

Show an overview of the current registry state.

```bash
is-pinoy registry status --dir ./subdomains
```

## Environment Variables

Required for `diff`, `sync`, and `status` (not needed for `validate`):

```
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ZONE_ID=
```

Use `--dotenv <path>` to load from a `.env` file:

```bash
is-pinoy registry sync --dir ./subdomains --dotenv .env.local
```

## Subdomain File Format

Each file in the `subdomains/` directory represents one subdomain:

```json
{
  "subdomain": "your-name",
  "owner": {
    "github": "your-github-username",
    "email": "you@example.com"
  },
  "records": {
    "CNAME": {
      "value": "your-deployment-url"
    }
  }
}
```
