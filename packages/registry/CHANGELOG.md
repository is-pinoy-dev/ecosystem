# @is-pinoy-dev/registry

## 0.0.8

### Patch Changes

- 5caa3a1: Fix false UPDATE actions caused by CNAME content format differences

  Cloudflare can return CNAME targets with a trailing dot or different
  casing (e.g. `jun.vercel.app.` instead of `jun.vercel.app`), causing
  the diff to miss the exact-content match and fall through to the
  type-match branch — producing an UPDATE on every sync even when nothing
  in the local JSON changed.

  Content is now normalized on both sides before comparison: CNAME values
  are stripped of trailing dots and lowercased, and TXT values are
  quote-wrapped. This prevents spurious UPDATE actions for domains whose
  records have not actually changed.

## 0.0.7

### Patch Changes

- Updated dependencies [e858dd0]
  - @is-pinoy-dev/validate@0.3.4

## 0.0.6

### Patch Changes

- Updated dependencies [da68b45]
  - @is-pinoy-dev/schemas@0.3.1
  - @is-pinoy-dev/validate@0.3.3

## 0.0.5

### Patch Changes

- Updated dependencies [6b4ce03]
  - @is-pinoy-dev/validate@0.3.2

## 0.0.4

### Patch Changes

- Updated dependencies [beedf81]
  - @is-pinoy-dev/validate@0.3.1

## 0.0.3

### Patch Changes

- Updated dependencies [bdefedc]
  - @is-pinoy-dev/validate@0.3.0
  - @is-pinoy-dev/schemas@0.3.0

## 0.0.2

### Patch Changes

- Updated dependencies [8985e5a]
  - @is-pinoy-dev/validate@0.2.0
  - @is-pinoy-dev/schemas@0.2.0

## 0.0.1

### Patch Changes

- Updated dependencies [51d2007]
  - @is-pinoy-dev/validate@0.1.0
  - @is-pinoy-dev/schemas@0.1.0
