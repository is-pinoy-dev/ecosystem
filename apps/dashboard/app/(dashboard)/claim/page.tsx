import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { PageHeader } from "@/components/page-header"
import { ClaimForm } from "./claim-form"

export const metadata: Metadata = {
  title: "Claim a portfolio",
}

export default async function ClaimPage() {
  const session = await auth()
  if (!session?.user?.login) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Portfolio"
        title="Claim a portfolio subdomain"
        description="Pick a subdomain and a template — your portfolio is rendered from your GitHub profile README. Submitting opens a pull request to the domains repo on your behalf; once it's merged, your subdomain goes live."
      />
      <div className="max-w-xl">
        <ClaimForm login={session.user.login} />
      </div>
    </div>
  )
}
