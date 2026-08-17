# Claim page: block the claim when a portfolio already exists

Date: 2026-08-16
Status: approved

## Problem

`/claim` renders its form unconditionally. The checks that decide whether a
claim can succeed all run *after* the user submits, inside `claimPortfolio`:

- `isTaken(subdomain)` — a `subdomains/<login>.json` already exists upstream
- `existingPortfolio(owner)` — the user already owns a record CNAME'd to
  `portfolio.is-pinoy.dev`

So someone who already has a hosted portfolio picks a style, clicks
**Claim & open pull request**, waits through a fork-and-branch round trip, and
is told no. Nothing on the page said so beforehand.

A third case is not detected at all: an open claim pull request that has not
merged yet. Clicking again re-opens the same PR (the 422 fallback in
`openPortfolioPR` recovers its URL), which is harmless but confusing — the page
gives no hint that the claim is already in flight.

## Goal

Detect all three states when the page renders, and disable the submit button
with an explanation instead of letting the user discover the answer by failing.

Non-goal: making the claim *safe*. The server action remains the gate. Page
state is a snapshot and can be stale by the time the button is clicked.

## Design

### One shared module

`isTaken` and `existingPortfolio` are private to `claim/actions.ts` today. They
move to a new `server-only` module, `apps/dashboard/lib/portfolio-claim-status.ts`,
which both the page and the action import. The pre-click state and the
post-click error then come from one implementation and cannot drift.

```ts
export type ClaimBlock =
  | { kind: "hosted";  subdomain: string; renamed: boolean }
  | { kind: "pending"; subdomain: string; url: string; number: number }
  | { kind: "taken";   subdomain: string }

export async function getClaimBlock(
  owner: OwnerIdentity,
  subdomain: string,
): Promise<ClaimBlock | null>
```

`renamed` is true when the held portfolio sits at a subdomain other than the
one the current login derives — the GitHub-rename case, which needs different
copy because "you already have a portfolio" would otherwise read as a bug.

### Precedence

`hosted` → `pending` → `taken`.

Several can be true at once. A live portfolio is the most informative thing to
say; failing that, an open PR is the actionable one; `taken` is the residual
case where the name belongs to somebody else.

### Detection order

The naive order — always call `getSubdomainsForOwner` — is expensive when D1 is
not configured, because the GitHub fallback in `lib/domains.ts` fetches *every*
subdomain file to find one. The cheap check answers the common case on its own:

1. Fetch `subdomains/<login>.json` once.
   - Missing → neither `hosted` nor `taken` at this name; continue to 2.
   - Present and owned by this user with the portfolio CNAME → `hosted`,
     `renamed: false`. Done, one request.
   - Present and not theirs → `taken`.
2. Only when step 1 found no file, run `getSubdomainsForOwner` to catch a
   portfolio held under a previous username → `hosted`, `renamed: true`.
3. `pending`: `GET /repos/is-pinoy-dev/domains/pulls?state=open&head=<login>:claim/portfolio-<sub>`.
   One request, no pagination — the same listing `openPortfolioPR` already does
   in its 422 fallback. Runs concurrently with 1–2.

Ownership in step 1 is decided by `isOwnedBy`, so a record carrying an
`owner.id` that isn't ours is never ours even when the logins agree — the
freed-login case.

### Known gap

A pending claim PR opened under a *previous* GitHub username sits on a
differently-named branch and will not be found by step 3. Accepted: once that
PR merges, step 2 catches it, and until then the action's 422 fallback still
returns the existing PR URL rather than erroring.

### Failure behavior: fail open

Every check returns `null` on throw or non-OK response. This is the rule the
existing code already states — the registry read is a courtesy that saves the
user a doomed pull request, and the server action plus CI stay authoritative.
A broken D1 or an exhausted GitHub rate limit must never brick `/claim` into a
permanently disabled button.

### Page and form

`page.tsx` awaits `getClaimBlock` before rendering rather than streaming it. A
button that renders enabled and then flips to disabled is worse than the
skeleton `loading.tsx` already shows.

`ClaimForm` gains `blocked: ClaimBlock | null` and:

- `disabled={pending || blocked !== null}` on the submit button, with
  `aria-describedby` pointing at the reason — a bare disabled button tells a
  screen reader nothing
- `onSubmit` early-returns when blocked, so Enter cannot route around it
- the trailing "Claiming opens a pull request…" paragraph is replaced by the
  reason and an onward link; the style pickers and "Preview with my GitHub"
  stay live, so the page keeps its value as a browse surface

Copy:

| State | Message | Link |
| --- | --- | --- |
| `hosted`, not renamed | You already have a hosted portfolio at `<sub>.is-pinoy.dev`. | Change its look in domain settings → `/domains/<sub>` |
| `hosted`, renamed | …at `<held>.is-pinoy.dev`, claimed under a previous GitHub username. One portfolio per account. | `/domains/<held>` |
| `pending` | You already opened a claim for `<sub>.is-pinoy.dev`. It goes live once a maintainer merges it. | View pull request #N |
| `taken` | `<sub>.is-pinoy.dev` is already claimed. | The record file on GitHub |

## Tests

`apps/dashboard` runs vitest over `lib/**/*.test.ts`. New
`lib/portfolio-claim-status.test.ts` stubs `fetch` and covers each state, the
precedence order, the one-request common path, and — the case that matters most
— every failure mode returning `null` rather than blocking.

## Follow-on work, not in this change

Restyling a hosted portfolio currently opens a pull request too, because the
`portfolio` block lives in the git record and `apps/portfolio` reads it from
raw.githubusercontent with `revalidate: 3600`. A theme change therefore costs a
maintainer merge plus up to an hour of cache. Making style mutable — a D1-backed
store that `resolveSubdomain` consults ahead of the git block — is a separate
cross-app design. It would change one detail here: the `hosted` copy should
point at an instant restyle control rather than implying another PR.
