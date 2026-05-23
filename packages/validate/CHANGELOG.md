# @is-pinoy-dev/validate

## 0.3.3

### Patch Changes

- Updated dependencies [da68b45]
  - @is-pinoy-dev/schemas@0.3.1

## 0.3.2

### Patch Changes

- 6b4ce03: Fix TypeScript rootDir inference — static JSON import of `../package.json` in `bin.ts` was causing `tsc` to expand `rootDir` to the project root, outputting compiled files to `dist/src/` instead of `dist/`. This broke CI builds from a clean checkout where no stale `dist/index.js` existed. Switched to runtime `readFileSync` to read the package version.

## 0.3.1

### Patch Changes

- beedf81: Fix TypeScript rootDir inference — static JSON import of `../package.json` in `bin.ts` was causing `tsc` to expand `rootDir` to the project root, outputting compiled files to `dist/src/` instead of `dist/`. This broke CI builds from a clean checkout where no stale `dist/index.js` existed. Switched to runtime `readFileSync` to read the package version.

## 0.3.0

### Minor Changes

- bdefedc: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

### Patch Changes

- Updated dependencies [bdefedc]
  - @is-pinoy-dev/schemas@0.3.0

## 0.2.0

### Minor Changes

- 8985e5a: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

### Patch Changes

- Updated dependencies [8985e5a]
  - @is-pinoy-dev/schemas@0.2.0

## 0.1.0

### Minor Changes

- 51d2007: Initial release of the is-pinoy.dev tooling — a free subdomain registry for Filipino developers.
  - `@is-pinoy-dev/cli` — CLI to validate and sync is-pinoy.dev subdomains to Cloudflare
  - `@is-pinoy-dev/validate` — public validator for is-pinoy.dev domain files
  - `@is-pinoy-dev/schemas` — Zod schemas and TypeScript types for is-pinoy.dev domain files

### Patch Changes

- Updated dependencies [51d2007]
  - @is-pinoy-dev/schemas@0.1.0
