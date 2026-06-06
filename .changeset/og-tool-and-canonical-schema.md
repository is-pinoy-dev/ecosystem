---
"@is-pinoy-dev/schemas": minor
---

Add `og` to `features.tools` in domain schema and relocate generated JSON Schema artifact.

- `domainFeaturesSchema.tools` now accepts `"og": boolean` alongside `"site-audit": boolean`.
- Generator (`pnpm generate:schema`) now writes to `packages/schemas/schema/v1/subdomain.schema.json` (canonical artifact in ecosystem) instead of the sibling `domains/` repo. Eliminates the cross-repo file write that required both repos to be checked out side-by-side.
- `schema/` directory added to the `files` array so the JSON Schema ships with the published npm package.
- Docs `$schema` URL references updated to point at the ecosystem-hosted artifact.
