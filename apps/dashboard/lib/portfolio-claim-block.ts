// Why a claim cannot go ahead, and how to say it.
//
// Deliberately pure and deliberately not `server-only`: the claim form is a
// client component and renders this same state, so the shape and the wording
// have to be reachable from the browser bundle. Everything that does IO to work
// the answer out lives in lib/portfolio-claim-status.ts, which imports these
// types and stays server-side.

export type ClaimBlock =
  /** The user already holds a live hosted portfolio at the address they wanted. */
  | { kind: "hosted"; subdomain: string; renamed: false }
  /**
   * They hold one, but at `subdomain` rather than the `wanted` address they
   * just tried for — they renamed the GitHub account since claiming. The
   * address has to be named or the refusal reads as a bug.
   */
  | { kind: "hosted"; subdomain: string; renamed: true; wanted: string }
  /** A claim pull request for this address is open and unmerged. */
  | { kind: "pending"; subdomain: string; url: string; number: number }
  /** The address is spoken for by a record that is not this user's portfolio. */
  | { kind: "taken"; subdomain: string }

const DOMAINS_REPO_URL = "https://github.com/is-pinoy-dev/domains"

/**
 * The block as one sentence, with no markup and no link.
 *
 * The server action answers in plain strings, so this is exactly what it
 * reports; the claim page renders the same sentence with `claimBlockLink`
 * attached. Sharing the wording is what stops the page and the action
 * explaining one state two different ways.
 */
export function claimBlockMessage(block: ClaimBlock): string {
  switch (block.kind) {
    case "hosted":
      return block.renamed
        ? `You already have a hosted portfolio at ${block.subdomain}.is-pinoy.dev, claimed under a previous GitHub username. One portfolio per account — ask a maintainer to move it to ${block.wanted}.is-pinoy.dev.`
        : `You already have a hosted portfolio at ${block.subdomain}.is-pinoy.dev.`
    case "pending":
      return `You already opened a claim for ${block.subdomain}.is-pinoy.dev. It goes live once a maintainer merges pull request #${block.number}.`
    case "taken":
      return `${block.subdomain}.is-pinoy.dev is already claimed.`
  }
}

export interface ClaimBlockLink {
  href: string
  label: string
  /** Off-site links open in a new tab and carry the usual rel guard. */
  external: boolean
}

/**
 * Somewhere useful to go instead. Every blocked state has one — a dead end that
 * only says no is the thing this whole change exists to remove.
 */
export function claimBlockLink(block: ClaimBlock): ClaimBlockLink {
  switch (block.kind) {
    case "hosted":
      return {
        href: `/domains/${block.subdomain}`,
        label: "Manage your portfolio",
        external: false,
      }
    case "pending":
      return {
        href: block.url,
        label: `View pull request #${block.number}`,
        external: true,
      }
    case "taken":
      return {
        href: `${DOMAINS_REPO_URL}/blob/main/subdomains/${block.subdomain}.json`,
        label: "View the record",
        external: true,
      }
  }
}
