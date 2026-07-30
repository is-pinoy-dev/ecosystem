import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { auth } from "@/auth"
import { PageHeader } from "@/components/page-header"
import { claimEnabled } from "@/lib/flags-server"
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
  if (!(await claimEnabled())) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Portfolio"
        title="Claim a portfolio subdomain"
        description="Pick a subdomain and a template — your portfolio is rendered from your GitHub profile README. Submitting opens a pull request to the domains repo on your behalf; once it's merged, your subdomain goes live."
      />
      <ClaimForm login={session.user.login} />
    </div>
  )
}
