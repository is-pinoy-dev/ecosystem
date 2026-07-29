---
"@is-pinoy-dev/validate": minor
---

Reserve `portfolio` and expose the reserved list on a `./reserved` subpath.

`portfolio.is-pinoy.dev` is the CNAME target every hosted portfolio points at,
but it was claimable: a `subdomains/portfolio.json` would have passed validation
and synced as an UPDATE against the platform's own record, breaking every
portfolio at once.

The new `@is-pinoy-dev/validate/reserved` export lets consumers read the list
without pulling in zod and the rest of the validator — `apps/portfolio`'s proxy
runs on the edge and now shares this list instead of keeping its own copy.
