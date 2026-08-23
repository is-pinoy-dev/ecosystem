import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { loadVisitsForSubdomains, type VisitsLoad } from "@/lib/analytics"
import { NoDomains } from "@/components/domain-list"
import { DomainsOverview } from "@/components/domains-overview"
import { PageHeader } from "@/components/page-header"
import { toDomainView, type PendingPRView } from "@/lib/domain-view"
import { getSubdomainsForOwner } from "@/lib/domains"
import { contactFormEnabled } from "@/lib/flags-server"
import { getGitHubAccessToken } from "@/lib/github-token"
import { getPendingProxyPRs } from "@/lib/proxy-pr"

/** Sparkline window for the per-card visits chart on this listing. */
const CARD_VISITS_WINDOW_DAYS = 7

export const metadata: Metadata = {
  title: "Domains",
  description:
    "View and manage every .is-pinoy.dev subdomain registered to your GitHub account.",
  alternates: {
    canonical: "/domains",
  },
}

export default async function DomainsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { login, githubId } = session.user
  const [{ owned }, contactFormFlagEnabled] = await Promise.all([
    getSubdomainsForOwner({ login, githubId }),
    contactFormEnabled(),
  ])

  // One listing call covers every row, so the pending-change state costs a
  // single request no matter how many domains the user owns.
  const token = await getGitHubAccessToken()
  const [pendingMap, visitsLoad] = await Promise.all([
    owned.length > 0
      ? getPendingProxyPRs(login, token ?? undefined)
      : Promise.resolve(new Map()),
    owned.length > 0
      ? loadVisitsForSubdomains(
          owned.map((domain) => domain.subdomain),
          CARD_VISITS_WINDOW_DAYS
        )
      : Promise.resolve<VisitsLoad>({ status: "absent" }),
  ])
  const pending: Record<string, PendingPRView> = {}
  const ownedNames = new Set(owned.map((domain) => domain.subdomain))
  for (const [subdomain, pr] of pendingMap) {
    if (ownedNames.has(subdomain)) {
      pending[subdomain] = { url: pr.url, number: pr.number }
    }
  }

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <PageHeader
        eyebrow="Registry"
        title="Your domains"
        description="See where each address routes, check its current state, and open a domain to manage records, platform tools, and traffic."
      />

      {owned.length > 0 ? (
        <DomainsOverview
          domains={owned.map((domain) =>
            toDomainView(domain, { contactFormFlagEnabled })
          )}
          pending={pending}
          visits={visitsLoad.status === "ok" ? visitsLoad.report : null}
          visitsUnavailable={visitsLoad.status === "unavailable"}
        />
      ) : (
        <NoDomains login={login} />
      )}
    </div>
  )
}
