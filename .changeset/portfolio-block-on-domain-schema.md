---
"@is-pinoy-dev/schemas": minor
"@is-pinoy-dev/validate": patch
"@is-pinoy-dev/registry": patch
"@is-pinoy-dev/cli": patch
---

Add the optional `portfolio` block to the domain schema.

A subdomain that opts into a hosted portfolio points its CNAME at our own
renderer and carries `portfolio: { template, theme?, sections? }` telling the
renderer which design to use. `template` is required when the block is present;
`sections` is an optional allow-list of profile-README heading slugs and also
sets their render order.

The block is inert to the registry and sync engine — to the differ it is just
another CNAME — so this is additive and backward-compatible for every existing
subdomain file. `schema/v1/subdomain.schema.json` is regenerated to match, which
is what unblocks the domains repo: until this ships, files carrying a
`portfolio` block validate only because Zod silently strips unknown keys, while
anything checking against the published JSON Schema rejects them
(`additionalProperties: false`).
