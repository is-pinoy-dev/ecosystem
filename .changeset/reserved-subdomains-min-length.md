---
"@is-pinoy-dev/validate": major
"@is-pinoy-dev/schemas": major
---

Expand reserved subdomain list and enforce 3-character minimum length.

`RESERVED_SUBDOMAINS` grows from 22 to ~95 keywords covering infrastructure, auth, environments, observability, assets, community, commerce, and brand protection. The `reserved_subdomains.json` duplicate has been removed — `reserved.ts` is now the single source of truth.

`domainSchema` now enforces `subdomain: min(3)` — subdomains shorter than 3 characters are rejected at the schema level.

**Breaking:** any subdomain shorter than 3 characters or matching a newly reserved keyword will now fail validation.
