# site-audit

## 0.3.1

### Patch Changes

- 1ef8f3f: Scan a subdomain at its own address unless it is actually a hosted portfolio.

  Reaching a hosted portfolio through the renderer (0.3.0) keyed the rewrite on
  the hostname alone, so `/audit-proxy` treated every `*.is-pinoy.dev` target as a
  portfolio. Most are not. `jappe.is-pinoy.dev` is a CNAME to its owner's own
  Vercel project, and rewriting it onto `portfolio.is-pinoy.dev` asked a
  completely different origin for a portfolio that was never claimed: the renderer
  answered 404 `no-portfolio-block`, and the scan reported that 404 against a site
  that serves 200 to every browser. Because the rewrite is ours rather than a
  redirect, `finalUrl` still named the portfolio's own address, so nothing in the
  report revealed that a different origin had been fetched.

  Being a subdomain of our zone is no longer the test. The proxy now resolves the
  target's own label against `subdomains/<label>.json` — the same file, and the
  same `portfolio` block, the renderer resolves on — and rewrites only for a
  record that carries one. Everything else, including an unclaimed name, is
  fetched as asked, and the shared secret never travels to an origin we do not
  render. With the domains repo unreachable the target is fetched at its real
  address: an honest connection error beats a 404 charged to whoever owns the
  name.

  Two things that made this hard to read are fixed with it. `x-portfolio-route:
worker` — the _healthy_ verdict — had no entry in the diagnosis table, so it was
  appended to the error bare, reading like a fault code when what it actually
  rules out is the whole routing half of the problem; it now says so. And the
  Worker's `features.tools.site-audit` gate treated any hiccup from
  raw.githubusercontent.com as "not enabled", handing an owner who had enabled the
  tool a page telling them to add a flag already in their record. Opting out is a
  fact stated in the file, so only a file we actually read may now withhold the
  tool; an unreachable registry fails open.

## 0.3.0

### Minor Changes

- cd7be16: Reach a hosted portfolio the way the proxy does, instead of through the edge.

  A hosted portfolio is only reachable at its own hostname because a Workers
  route rewrites the request onto the renderer — and a `fetch()` from inside a
  Worker to its own zone does not re-run that zone's routes. Cloudflare skips
  them to keep Workers from recursing.

  So `/audit-proxy` scanning `<label>.is-pinoy.dev` bypassed
  tools-portfolio-proxy, reached the origin still carrying the portfolio's own
  hostname, and failed the TLS handshake against a certificate that does not
  cover it. The scan reported **HTTP 525** for a page that serves perfectly to a
  browser — and before the previous release, reported it as 7 of 29 SEO checks
  passing rather than as a failed fetch.

  For a subdomain of our own zone the proxy now does what portfolio-proxy does:
  addresses the renderer directly and carries the label in a header,
  authenticated by the shared secret. The apex and external sites are fetched as
  asked, and the secret never travels to a host outside the zone. Unconfigured,
  it falls back to the plain public fetch.

  Deploying this needs `PORTFOLIO_PROXY_SECRET` on the site-audit Worker — the
  same value tools-portfolio-proxy and the renderer already hold:

  ```
  wrangler secret put PORTFOLIO_PROXY_SECRET -c worker/wrangler.toml
  ```

- 84398a4: Report a failed fetch as a failed fetch, instead of scoring it.

  An HTML parser accepts anything. A 404 body, an empty response and a JSON
  error each parse into a valid `Document` with an empty `<head>`, so every check
  found its field missing and the report read as the audited site's fault. The
  floor this produces is 7 of 29 SEO checks — `URL`, the five heading counts, and
  `Image Alt Texts` passing on "no images" — which looks like a real, very bad
  score rather than a page that was never fetched.

  `/audit-proxy` now returns the status, content type, byte count and final URL
  alongside the bytes, and the scan refuses to grade a response that isn't a
  2xx HTML document from the origin that was asked for, naming which of those it
  was instead. It also sends `Accept: text/html`, so an origin that
  content-negotiates hands back the document a crawler would see.

  When the failed response carries `x-portfolio-route` — the verdict
  `apps/portfolio/proxy.ts` sets on every response — the error names it and says
  what it means, so a hosted portfolio that returned a 404 reports the reason it
  never rendered (no label, no secret, secret mismatch) rather than reporting
  that the page has no metadata.

## 0.2.8

### Patch Changes

- d9aaf93: Bring hosted portfolios up to the standard the site-audit tool grades against.
  - **`X-Robots-Tag`.** The proxy now states the indexing verdict as a response
    header as well as a `<meta>`, decided by the same fact the meta robots is:
    a request carrying a subdomain label is somebody's portfolio at its own
    address and is indexable; the apex, the renderer host and `?preview=` renders
    are not. robots.txt, the sitemap and the manifest carry no meta of their own,
    so the header is the only signal on them.
  - **`hreflang`.** A claimed portfolio declares self-referential `en` and
    `x-default` alternates, so a crawler reads the language set as deliberate
    rather than absent.
  - **Title and description windows.** The title now shortens a long GitHub
    display name rather than losing the ` — Portfolio` suffix past the ~60
    characters a search result shows, and the description is bounded at both ends
    — a bio too short to work as a snippet is padded with the generated summary
    instead of leaving the engine to invent one.
  - **One H1 per page.** `pixel-card` rendered the owner's name as a `CardTitle`
    (a `<div>`) and so had no H1 at all; it now uses a heading like the other
    layout templates. README headings are demoted one level on render, so a
    profile opening with `# Hi there` no longer gives the page a second subject.
  - **Image alt text.** A README `<img>` with no alt — badge rows especially —
    is marked `alt=""` rather than left bare for a screen reader to read the URL
    out of.
  - **`twitter:site`.** Set from the owner's handle alongside `twitter:creator`;
    on a personal site the publisher and the author are the same person.

  The audit tool itself had a matching blind spot: it read `@type` off the
  outermost JSON-LD object, so the schema.org-recommended `@graph` shape — the
  one a portfolio uses to describe a Person on a ProfilePage with an ItemList of
  their work — was reported as untyped structured data. It now walks `@graph` and
  array `@type`s, and recognises `ProfilePage`, `Person`, `WebPage`,
  `CollectionPage` and `ItemList` as rich-result types.

- Updated dependencies [242ff77]
  - @is-pinoy-dev/schemas@1.6.0

## 0.2.7

### Patch Changes

- Updated dependencies [41fb09a]
  - @is-pinoy-dev/schemas@1.5.1

## 0.2.6

### Patch Changes

- Updated dependencies [ca63d4c]
  - @is-pinoy-dev/schemas@1.5.0

## 0.2.5

### Patch Changes

- Updated dependencies [bef4a89]
  - @is-pinoy-dev/schemas@1.4.0

## 0.2.4

### Patch Changes

- Updated dependencies [b69735b]
  - @is-pinoy-dev/schemas@1.3.0

## 0.2.3

### Patch Changes

- Updated dependencies [8f79768]
  - @is-pinoy-dev/schemas@1.2.0

## 0.2.2

### Patch Changes

- Updated dependencies [0a3c2aa]
  - @is-pinoy-dev/schemas@1.1.0

## 0.2.1

### Patch Changes

- Updated dependencies [19b93e4]
  - @is-pinoy-dev/schemas@1.0.0
