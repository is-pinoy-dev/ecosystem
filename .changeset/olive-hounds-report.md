---
"@is-pinoy-dev/registry": minor
"@is-pinoy-dev/cli": minor
---

Fail a sync that failed.

`sync` and `syncWorkerRoutes` applied every action with `Promise.allSettled`,
logged rejections as `FAILED:`, and returned normally. The CLI then printed
"Sync complete." and exited 0 regardless, so a run in which every call was
rejected was indistinguishable from a clean one — in CI, a green check over a
broken zone.

This is worst for hosted portfolios, because the two halves fail apart. DNS
records are written first and Workers routes second, so a token scoped for DNS
but not for Workers Routes writes every record and creates no route. The name
then resolves and Cloudflare proxies it to an origin holding no certificate for
it, and the portfolio serves **HTTP 525** from that moment on — with a green
sync behind it.

Both functions now return the number of actions that failed. Every action is
still attempted, so one rejection cannot strand the rest. `registry sync` exits
1 when any failed, and when the failures are routes it names the consequence
and the permission to check.
