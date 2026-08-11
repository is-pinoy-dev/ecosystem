---
"@is-pinoy-dev/validate": minor
---

Add host identification: `hostProviderForTarget`, `hostProviderForRecords`, `normalizeHostTarget`, `HOST_PROVIDER_IDS`, `HOST_PROVIDER_NAMES`, and `PORTFOLIO_RENDERER_HOST`.

Recognises the host a subdomain is served by from its CNAME target — our own
portfolio renderer, Vercel, GitHub Pages, Netlify, or Cloudflare Pages — and
returns null for anything else. Identification, not validation: an unrecognised
target is a host we have no fingerprint for, never an error. A records identify
no host and return null rather than a guess.

The dashboard already did this privately; moving it here lets the public
showcase label a card by what it points at without the two surfaces drifting.
