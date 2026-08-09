---
"@is-pinoy-dev/schemas": minor
"@is-pinoy-dev/validate": minor
"@is-pinoy-dev/registry": minor
---

Tie hosted portfolios to their owner's GitHub identity.

- `owner.id` (GitHub's numeric account ID) is a new optional field on the
  domain schema. Unlike a login it can't be renamed or re-registered by
  somebody else, so ownership matched on it survives a GitHub rename.
- `validateDomain` now rejects a record that carries a `portfolio` block whose
  subdomain isn't its owner's GitHub username. A hosted portfolio renders
  `owner.github`'s profile, so a mismatch means the address advertises one
  person and the page shows another's. Subdomains without a `portfolio` block
  are unaffected and stay free to be named anything.
- `validateDomains` reports a warning when one owner holds more than one
  hosted portfolio or more than one custom subdomain, counting by numeric ID
  where records carry it. Warnings rather than errors: the whole directory is
  checked on every run, so a hard failure would red unrelated pull requests.
