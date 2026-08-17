import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { auth } from "@/auth"
import { DomainDetailHeader } from "@/components/domain-detail-header"
import { DomainsManager } from "@/components/domains-manager"
import { PortfolioStylePanel } from "@/components/portfolio-style-panel"
import { getVisitsForSubdomains } from "@/lib/analytics"
import { hasDatabase } from "@/lib/db"
import { toDomainView, type PendingPRView } from "@/lib/domain-view"
import { getSubdomainsForOwner } from "@/lib/domains"
import { getGitHubAccessToken } from "@/lib/github-token"
import { getPortfolioStyle } from "@/lib/portfolio-config"
import { getPendingProxyPRs } from "@/lib/proxy-pr"
import { hasScreenshotWorker } from "@/lib/screenshots/client"

interface Props {
  params: Promise<{ subdomain: string }>
}

const SUBDOMAIN_PATTERN = /^[a-z0-9-]{3,63}$/

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subdomain } = await params
  const normalized = subdomain.toLowerCase()
  return {
    title: `${normalized}.is-pinoy.dev`,
    description: `Manage DNS routing, platform tools, and traffic for ${normalized}.is-pinoy.dev.`,
    alternates: { canonical: `/domains/${normalized}` },
  }
}

export default async function DomainDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { subdomain } = await params
  const normalized = subdomain.trim().toLowerCase()
  if (!SUBDOMAIN_PATTERN.test(normalized)) notFound()

  const { owned } = await getSubdomainsForOwner({
    login: session.user.login,
    githubId: session.user.githubId,
  })
  const record = owned.find((domain) => domain.subdomain === normalized)
  if (!record) notFound()

  const domain = toDomainView(record)
  const hosted = domain.provider?.id === "portfolio"
  // The refresh action needs both the registry read model (to check ownership
  // and the cooldown) and the screenshot Worker. Where either is absent the
  // control can only ever fail, so the block is not offered at all.
  const canRefreshPreview = hosted && hasDatabase() && hasScreenshotWorker()

  const [token, visits, style] = await Promise.all([
    getGitHubAccessToken(),
    getVisitsForSubdomains([record.subdomain]).catch((error) => {
      console.error("[domain] visit totals unavailable", error)
      return null
    }),
    // Read straight from the domains repo — the registry read model does not
    // carry the portfolio block. Only worth a request for a record actually
    // pointed at our renderer.
    hosted ? getPortfolioStyle(record.subdomain) : null,
  ])
  const pendingMap = await getPendingProxyPRs(
    session.user.login,
    token ?? undefined
  )
  const pendingPR = pendingMap.get(record.subdomain)
  const pending: Record<string, PendingPRView> = pendingPR
    ? {
        [record.subdomain]: { url: pendingPR.url, number: pendingPR.number },
      }
    : {}

  return (
    <div className="flex max-w-5xl flex-col gap-8">
      <DomainDetailHeader
        domain={domain}
        pendingPR={pending[record.subdomain] ?? null}
        canRefreshPreview={canRefreshPreview}
      />
      {style ? (
        <PortfolioStylePanel
          subdomain={record.subdomain}
          login={session.user.login}
          style={style}
          pendingPR={pending[record.subdomain] ?? null}
        />
      ) : null}
      <DomainsManager
        domains={[domain]}
        pending={pending}
        visits={visits}
        detail
      />
    </div>
  )
}
