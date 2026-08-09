import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { PageHeader } from "@/components/page-header"
import { claimsEnabled } from "@/lib/flags-server"
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

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Portfolio"
        title="Claim your portfolio subdomain"
        description="Your portfolio is built from your GitHub profile, so it lives at your GitHub username. Pick a look, preview it, then open the claim pull request when it feels right."
      />
      {derived.ok ? (
        <ClaimForm login={login} subdomain={derived.subdomain} />
      ) : (
        <div className="border border-destructive/35 bg-destructive/5 p-5 text-sm leading-6 text-foreground">
          {derived.error} Hosted portfolios are always addressed by their
          owner&apos;s GitHub username, so there is no other address to claim
          here.
        </div>
      )}
    </div>
  )
}
