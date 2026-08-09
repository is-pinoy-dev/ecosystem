// A hosted portfolio renders the claimant's own GitHub profile, so its address
// is their GitHub username — not a name they get to pick. Deriving the label
// from the login in one place is what makes that true on every path: the claim
// page, the server action, and the code that opens the pull request all ask
// this module, so none of them can pair one person's login with another
// person's subdomain.

/** The registry's own floor (`domainSchema.subdomain`), repeated here so the
 *  claim flow can explain the failure instead of echoing a Zod message. */
const MIN_LENGTH = 3
const MAX_LENGTH = 63

/** DNS label: alphanumeric, inner hyphens only. */
const LABEL = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/

/**
 * The subdomain a portfolio claim by `login` must use.
 *
 * GitHub logins keep the case they were registered with; DNS labels and the
 * `subdomains/<name>.json` files are lowercase, so the login is folded down.
 * GitHub already restricts logins to alphanumerics and inner hyphens, which
 * makes this a valid label for every account that can reach the dashboard —
 * `portfolioSubdomainFor` covers the handful that still can't.
 */
export function portfolioSubdomain(login: string): string {
  return login.trim().toLowerCase()
}

export type PortfolioSubdomainResult =
  | { ok: true; subdomain: string }
  | { ok: false; error: string }

/**
 * Same derivation, but reporting the logins that can't become a subdomain
 * rather than handing back a label the registry would reject: GitHub allows
 * one- and two-character usernames and this registry requires three.
 */
export function portfolioSubdomainFor(login: string): PortfolioSubdomainResult {
  const subdomain = portfolioSubdomain(login)

  if (subdomain.length < MIN_LENGTH) {
    return {
      ok: false,
      error: `Your GitHub username (@${login}) is ${subdomain.length} character${subdomain.length === 1 ? "" : "s"} long. Subdomains need at least ${MIN_LENGTH}.`,
    }
  }
  if (subdomain.length > MAX_LENGTH || !LABEL.test(subdomain)) {
    return {
      ok: false,
      error: `Your GitHub username (@${login}) can't be used as a subdomain address.`,
    }
  }

  return { ok: true, subdomain }
}
