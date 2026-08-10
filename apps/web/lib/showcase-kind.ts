// What kind of thing a showcase card points at.
//
// Every card used to be labelled "Portfolio" regardless, which flattened a real
// distinction: some subdomains are rendered by us from their owner's GitHub
// profile, and some are sites their owners built and host themselves. The
// registry already knows which is which, so the card can say so.
//
// Deliberately three values, not one per host. Which CDN somebody's own site
// sits on is not something a visitor to the showcase is asking about, and
// naming it would turn the community grid into a list of hosting vendors.

import { hostProviderForRecords } from "@is-pinoy-dev/validate"

export type ShowcaseKind = "hosted-portfolio" | "github-pages" | "site"

export const SHOWCASE_KIND_LABELS: Record<ShowcaseKind, string> = {
  // Rendered by us from the owner's GitHub profile README.
  "hosted-portfolio": "Hosted portfolio",
  // The owner's own site, built and published through GitHub.
  "github-pages": "GitHub Pages",
  // The owner's own site on a host we either know or don't — either way, the
  // showcase's own premise is the honest label for it.
  site: "Portfolio",
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
  // the fallback below rather than being mislabelled a plain site.
  if (entry.portfolio) return "hosted-portfolio"

  switch (hostProviderForRecords(entry.records)) {
    case "portfolio":
      return "hosted-portfolio"
    case "github":
      return "github-pages"
    default:
      return "site"
  }
}

export function showcaseKindLabel(entry: ShowcaseKindInput): string {
  return SHOWCASE_KIND_LABELS[showcaseKind(entry)]
}
