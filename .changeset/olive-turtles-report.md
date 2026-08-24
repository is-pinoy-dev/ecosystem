---
"@is-pinoy-dev/registry": minor
"@is-pinoy-dev/cli": minor
---

Warn about records in the zone that no domain file accounts for.

Deleting a subdomain's JSON file is the intuitive way to retire it, and it does
nothing at all. `desired` is built by enumerating the files that exist, so a
deleted file is *absent* rather than destroyed, and the DELETE branch only ever
fires for a domain still present with `"destroy": true`. The record stays live
and resolving, and sync reports "No changes needed. All domains are in sync."
over it.

That is how `example.is-pinoy.dev` kept answering for weeks after its file was
removed: the sync run for the deleting commit loaded 45 domains, fetched 66
records, and emitted zero actions.

`diff` now names those records instead of passing over them in silence. It does
not delete them — a record with no file behind it is genuinely ambiguous, and
guessing wrong takes a live site down — so the warning points at the fix
(restore the file with `"destroy": true`). The check is deliberately narrow so
it stays worth reading: only `<label>.<zone>` names, never the apex or deeper
records, never a reserved label where the platform's own hand-made records live
(`portfolio`, `status`, `www`, ...), never an underscore-prefixed service name,
and never under `--only`, where `desired` is a subset by construction.
