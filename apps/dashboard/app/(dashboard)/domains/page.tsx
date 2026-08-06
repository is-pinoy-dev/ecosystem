import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { NoDomains } from "@/components/domain-list"
import {
  DomainsManager,
  type PendingPRView,
} from "@/components/domains-manager"
import { PageHeader } from "@/components/page-header"
import { getVisitsForSubdomains } from "@/lib/analytics"
import { toDomainView } from "@/lib/domain-view"
import { getSubdomainsForOwner } from "@/lib/domains"
import { getGitHubAccessToken } from "@/lib/github-token"
import { getPendingProxyPRs } from "@/lib/proxy-pr"

export const metadata: Metadata = {
  title: "Domains",
  description:
    "View and manage the DNS records and pending changes for every .is-pinoy.dev subdomain you own.",
  alternates: {
    canonical: "/domains",
  },
}

export default async function DomainsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { login } = session.user
  const { owned } = await getSubdomainsForOwner(login)

  // One listing call covers every row, so the pending-change banner costs a
  // single request no matter how many domains the user owns.
  const token = await getGitHubAccessToken()
  const pendingMap =
    owned.length > 0
      ? await getPendingProxyPRs(login, token ?? undefined)
      : new Map()

  // Scoped to the names resolved for this session above, so the query can only
  // ever reach rows belonging to the signed-in owner. A failure here must not
  // take the page down with it — the listing is the point of the page and the
  // visit totals are an addition to it.
  const visits = await getVisitsForSubdomains(
    owned.map((domain) => domain.subdomain)
  ).catch((error) => {
    console.error("[domains] visit totals unavailable", error)
    return null
  })

  const pending: Record<string, PendingPRView> = {}
  for (const [subdomain, pr] of pendingMap) {
    pending[subdomain] = { url: pr.url, number: pr.number }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <PageHeader
        eyebrow="Registry"
        title="Your domains"
        description="DNS records registered to your GitHub account, and the platform features switched on for each. Your settings live in git, so saving opens a pull request. To change a DNS record itself, edit its file in the domains repository."
      />

      {owned.length > 0 ? (
        <DomainsManager
          domains={owned.map(toDomainView)}
          pending={pending}
          visits={visits}
        />
      ) : (
        <NoDomains login={login} />
      )}
    </div>
  )
}
