import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"
import { LogOut } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@is-pinoy-dev/ui/components/card"
import { auth } from "@/auth"
import { GitHubIcon } from "@/components/icons"
import { PageHeader } from "@/components/page-header"
import { signOutToLogin } from "@/lib/actions"

export const metadata: Metadata = {
  title: "Account",
}

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { name, login, email, image } = session.user

  const details = [
    { label: "Username", value: `@${login}`, mono: true },
    { label: "Display name", value: name ?? "—", mono: false },
    { label: "Email", value: email ?? "—", mono: false },
  ]

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Account"
        title="Your account"
        description="Subdomain ownership is verified against this GitHub account. The dashboard only reads your public profile."
      />

      <Card>
        <CardHeader className="border-b [.border-b]:pb-5">
          <div className="flex items-center gap-4">
            {image ? (
              <Image
                src={image}
                alt=""
                width={56}
                height={56}
                className="size-14 shrink-0 border border-border"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center border border-border bg-secondary font-mono text-lg font-semibold text-secondary-foreground uppercase"
              >
                {login.slice(0, 2)}
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <CardTitle className="truncate text-lg font-semibold">
                {name ?? login}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1.5">
                  <GitHubIcon size={12} />@{login}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col">
          <ul className="m-0 list-none p-0">
            {details.map((detail) => (
              <li
                key={detail.label}
                className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border py-2.5"
              >
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                  {detail.label}
                </span>
                <span
                  className={
                    detail.mono
                      ? "font-mono text-sm text-foreground"
                      : "text-sm text-foreground"
                  }
                >
                  {detail.value}
                </span>
              </li>
            ))}
            <li className="flex min-h-11 flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2.5">
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                OAuth access
              </span>
              <a
                href="https://github.com/settings/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent underline"
              >
                Manage on GitHub
              </a>
            </li>
          </ul>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-lg font-semibold tracking-[-0.02em] text-foreground">
          Session
        </h2>
        <p className="m-0 text-sm leading-6 text-muted-foreground">
          Signing out ends your dashboard session on this device. Your
          subdomains and registry records are not affected.
        </p>
        <form action={signOutToLogin}>
          <Button type="submit" variant="destructive" className="gap-2">
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </form>
      </section>
    </div>
  )
}
