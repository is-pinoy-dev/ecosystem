import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { PageHeader } from "@/components/page-header"
import { claimsEnabled } from "@/lib/flags-server"
import { getGitHubAccessToken } from "@/lib/github-token"
import { getClaimBlock } from "@/lib/portfolio-claim-status"
import { portfolioSubdomainFor } from "@/lib/portfolio-subdomain"
import { ClaimForm } from "./claim-form"

export const metadata: Metadata = {
  title: "Claim a portfolio",
  description:
    "Claim a free .is-pinoy.dev portfolio subdomain rendered from your GitHub profile README.",
  alternates: {
    canonical: "/claim",
  },
}

export default async function ClaimPage() {
  const session = await auth()
  if (!session?.user?.login) {
    redirect("/login")
  }

  // Behave as though the route does not exist while the flag is off, so typing
  // the URL gets you no further than the hidden tab does.
  if (!(await claimsEnabled())) {
    notFound()
  }

  const login = session.user.login
  const derived = portfolioSubdomainFor(login)

  // Awaited rather than streamed behind Suspense: a submit button that renders
  // enabled and then turns itself off is worse than the skeleton loading.tsx
  // already shows, because the window in between is exactly long enough to
  // click. Every read inside fails open, so a slow or broken registry costs the
  // page latency, never the ability to claim.
  const blocked = derived.ok
    ? await getClaimBlock(
        { login, githubId: session.user.githubId },
        derived.subdomain,
        { token: (await getGitHubAccessToken()) ?? undefined },
      )
    : null

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Portfolio"
        title="Claim your portfolio subdomain"
        description="Your portfolio is built from your GitHub profile, so it lives at your GitHub username. Pick a look, preview it, then open the claim pull request when it feels right."
      />
      {derived.ok ? (
        <ClaimForm
          login={login}
          subdomain={derived.subdomain}
          blocked={blocked}
        />
      ) : (
        <div className="flex flex-col gap-3 border border-destructive/35 bg-destructive/5 p-5 text-sm leading-6 text-foreground">
          <p className="m-0">
            {derived.error} Hosted portfolios are always addressed by their
            owner&apos;s GitHub username, so there is no other address to claim
            here.
          </p>
          <p className="m-0 text-muted-foreground">
            You can still register an ordinary subdomain of your choosing and
            point it at a site you host yourself — that route goes through a
            pull request against the domains repo.{" "}
            <a
              href="https://docs.is-pinoy.dev/guides"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              Read the guide
            </a>
            .
          </p>
        </div>
      )}
    </div>
  )
}
