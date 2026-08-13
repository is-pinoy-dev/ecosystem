# portfolio

## 0.1.1

### Patch Changes

- Updated dependencies [89c4ad3]
  - @is-pinoy-dev/validate@1.3.0

## 0.1.0

### Minor Changes

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

### Patch Changes

- Updated dependencies [242ff77]
  - @is-pinoy-dev/schemas@1.6.0
  - @is-pinoy-dev/validate@1.2.0

## 0.0.3

### Patch Changes

- Updated dependencies [41fb09a]
  - @is-pinoy-dev/schemas@1.5.1
  - @is-pinoy-dev/validate@1.1.1

## 0.0.2

### Patch Changes

- Updated dependencies [ca63d4c]
- Updated dependencies [ca63d4c]
  - @is-pinoy-dev/schemas@1.5.0
  - @is-pinoy-dev/validate@1.1.0

## 0.0.1

### Patch Changes

- Updated dependencies [bef4a89]
  - @is-pinoy-dev/schemas@1.4.0
  - @is-pinoy-dev/validate@1.0.4
