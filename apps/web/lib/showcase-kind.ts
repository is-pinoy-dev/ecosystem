// What kind of thing a showcase card points at.
//
// Two values, and the line between them is who built the page. A subdomain with
// a `portfolio` block is rendered by us from the owner's GitHub profile;
// everything else is a site its owner built and hosts themselves. Where they
// host it — GitHub Pages, Vercel, Netlify, their own box — is not something a
// visitor to the showcase is asking about, and naming it would turn the
// community grid into a list of hosting vendors.

import { hostProviderForRecords } from "@is-pinoy-dev/validate"

export type ShowcaseKind = "github-profile" | "portfolio"

export const SHOWCASE_KIND_LABELS: Record<ShowcaseKind, string> = {
  // Rendered by us from the owner's GitHub profile.
  "github-profile": "GitHub Profile",
  // The owner's own site, wherever it happens to be hosted.
  portfolio: "Portfolio",
}

export interface ShowcaseKindInput {
  portfolio?: unknown
  records: Record<string, unknown>
}

export function showcaseKind(entry: ShowcaseKindInput): ShowcaseKind {
  // The `portfolio` block is the claim itself — the CNAME to the renderer is
  // written downstream of it by sync. Reading the block first means a card is
  // labelled correctly during the window before DNS has caught up, and that a
  // record hand-pointed at the renderer without a block still resolves through
  // the fallback below rather than being mislabelled a self-hosted site.
  if (entry.portfolio) return "github-profile"

  return hostProviderForRecords(entry.records) === "portfolio"
    ? "github-profile"
    : "portfolio"
}

export function showcaseKindLabel(entry: ShowcaseKindInput): string {
  return SHOWCASE_KIND_LABELS[showcaseKind(entry)]
}
