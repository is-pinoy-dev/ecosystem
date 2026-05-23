# is-pinoy CLI Design

## Overview

A CLI tool (`is-pinoy`) for managing Philippine domain DNS registry on Cloudflare. Initial focus: `registry` subcommand with validate, diff, sync, and status operations.

## Package

- **Location:** `packages/cli/`
- **Package name:** `@is-pinoy/cli`
- **Binary name:** `is-pinoy`
- **Type:** ESM (`"type": "module"`)
- **Build:** `tsc` → `dist/`

## Dependencies

- `commander` — CLI framework
- `@is-pinoy/registry` (workspace:*) — core DNS logic
- `@is-pinoy/schemas` (workspace:*) — validation schemas (indirect through registry)

## CLI Structure

```
is-pinoy registry validate [options]
is-pinoy registry diff     [options]
is-pinoy registry sync     [options]
is-pinoy registry status   [options]
```

### Global Flags (apply to all registry subcommands)

| Flag | Alias | Default | Description |
|------|-------|---------|-------------|
| `--dir` | `-d` | `./domains` | Directory containing domain JSON files |
| `--zone-id` | — | `CLOUDFLARE_ZONE_ID` env | Cloudflare zone ID |
| `--api-key` | — | `CLOUDFLARE_API_TOKEN` env | Cloudflare API token |

## Subcommands

### `registry validate`

Validates all `.json` files in the domains directory.

- Runs registry's `loadDomains()` + `validateDomains()` logic
- Reports errors per file: schema violations, duplicate domains, reserved subdomains
- Exit code 0 if valid, 1 if any validation errors
- Human-readable error output

### `registry diff`

Compares desired domain state (from files) against live Cloudflare DNS records.

- Loads and validates domains from files
- Fetches current DNS records from Cloudflare via registry's provider
- Computes diff (records to create, update, delete)
- Prints a table of changes (no-op if everything matches)

### `registry sync`

Applies the diff to Cloudflare.

- Runs diff first
- Confirms with user before making changes (interactive prompt)
- Optional `--yes` / `-y` flag to skip confirmation
- Executes create/update/delete via registry's sync function
- Reports results per action

### `registry status`

Shows the current state of all registered domains.

- Loads domain files
- Fetches current Cloudflare records
- Displays a summary: registered domains, record counts, sync health

## File Structure

```
packages/cli/
  package.json
  tsconfig.json
  eslint.config.js
  src/
    index.ts                 -- entry point, program definition
    commands/
      registry/
        index.ts             -- registry command group (commander .command('registry'))
        validate.ts          -- validate subcommand handler
        diff.ts              -- diff subcommand handler
        sync.ts              -- sync subcommand handler
        status.ts            -- status subcommand handler
    utils/
      cloudflare.ts          -- reads/merges env + CLI flag credentials
      output.ts              -- formatted console output (colors, tables)
      path.ts                -- resolves --dir relative to cwd
```

## Output Style

- Human-readable terminal output
- Colors for status (green = ok, yellow = changes, red = errors)
- Tables for structured data (e.g., diff, status)
- Use `picocolors` for lightweight color (1/10 the size of chalk)
- Use `console.log` for output (no heavy table library — manual formatting or simple approach)

### Error Handling

- Command errors print a human-readable message to stderr
- Non-zero exit codes for errors
- Wrapping registry errors with context (which file, which domain)

## CI / Testing

- Tests in `packages/cli/tests/` using vitest
- Unit test command handlers with mocked registry functions
- Integration tests can be added later
- Follows same vitest setup as `packages/registry`
