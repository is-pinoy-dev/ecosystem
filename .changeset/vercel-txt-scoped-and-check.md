---
"@is-pinoy-dev/registry": minor
"@is-pinoy-dev/cli": minor
---

Make Vercel verification TXT deletion scope-aware and add a re-add gate.

`diff` now accepts a `scoped` option. When the desired domains are a subset
(e.g. from `--only <changed files>`), orphaned `vc-domain-verify` TXT deletion
is restricted to subdomains present in that subset. Previously a scoped
diff/dry-run reported phantom `DELETE`s for every other subdomain's still-valid
challenge — deletes the full-registry sync never performs. The `diff` and `sync`
CLI commands pass `scoped` automatically whenever `--only` is used.

`registry vercel-cleanup` gains `--only <files...>` (mirroring `sync`/`diff`)
and `--check`. Check mode probes the scoped domains and exits non-zero if any
still declares a verification TXT for a domain already attached and verified on
Vercel — a re-add of a single-use challenge the cleanup already removed. It is
read-only and never writes, even with `--write`. Domains not yet verified probe
unhealthy and are allowed, so genuine new registrations still pass.
