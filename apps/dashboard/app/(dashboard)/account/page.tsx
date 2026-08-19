import type { Metadata } from "next"
import Image from "next/image"
import { redirect } from "next/navigation"
import { LogOut } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { auth } from "@/auth"
import { GitHubIcon } from "@/components/icons"
import { ContactEmailPanel } from "@/components/contact-email-panel"
import { PageHeader } from "@/components/page-header"
import { signOutToLogin } from "@/lib/actions"
import {
  getDestinationAddressStatus,
  hasEmailRouting,
  type DestinationAddressStatus,
} from "@/lib/cloudflare-email"
import { getContactEmail } from "@/lib/contact-email"
import { contactFormEnabled } from "@/lib/flags-server"

export const metadata: Metadata = {
  title: "Account",
  description:
    "The GitHub account your .is-pinoy.dev subdomain ownership is verified against.",
  alternates: {
    canonical: "/account",
  },
}

export default async function AccountPage() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }

  const { name, login, email, image, githubId } = session.user

  // Gate the section, not the page: /account has plenty else to show, so a
  // disabled release flag simply omits Contact Form rather than 404ing the
  // whole page the way /claim does for its own flag.
  const showContactForm = await contactFormEnabled()
  let contactEmailStatus: DestinationAddressStatus = "absent"
  if (showContactForm && githubId && hasEmailRouting()) {
    const contactEmail = await getContactEmail(githubId)
    contactEmailStatus = contactEmail
      ? await getDestinationAddressStatus(contactEmail).catch((error) => {
          console.error("[account] contact email status unavailable", error)
          return "absent" as const
        })
      : "absent"
  }

  const details = [
    { label: "Username", value: `@${login}`, mono: true },
    { label: "Display name", value: name ?? "—", mono: false },
    { label: "Email", value: email ?? "—", mono: false },
  ]

  return (
    <div className="flex max-w-[720px] flex-col gap-10">
      <PageHeader
        eyebrow="Account"
        title="Your account"
        description="Subdomain ownership is verified against this GitHub account. The dashboard only reads your public profile."
      />

      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          {image ? (
            <Image
              src={image}
              alt=""
              width={64}
              height={64}
              className="size-16 shrink-0 border border-border"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex size-16 shrink-0 items-center justify-center border border-border bg-secondary font-mono text-xl font-semibold text-secondary-foreground uppercase"
            >
              {login.slice(0, 2)}
            </span>
          )}
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="truncate text-xl font-semibold tracking-[-0.02em] text-foreground">
              {name ?? login}
            </span>
            <Badge variant="secondary" className="gap-1.5 self-start">
              <GitHubIcon size={12} />@{login}
            </Badge>
          </div>
        </div>

        <ul className="m-0 list-none border-t border-border p-0">
          {details.map((detail) => (
            <li
              key={detail.label}
              className="grid min-h-12 items-center gap-x-6 gap-y-0.5 border-b border-border py-3 sm:grid-cols-[180px_1fr]"
            >
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                {detail.label}
              </span>
              <span
                className={
                  detail.mono
                    ? "min-w-0 truncate font-mono text-sm text-foreground"
                    : "min-w-0 truncate text-sm text-foreground"
                }
              >
                {detail.value}
              </span>
            </li>
          ))}
          <li className="grid min-h-12 items-center gap-x-6 gap-y-0.5 border-b border-border py-3 sm:grid-cols-[180px_1fr]">
            <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              OAuth access
            </span>
            <a
              href="https://github.com/settings/applications"
              target="_blank"
              rel="noopener noreferrer"
              className="justify-self-start text-sm text-accent underline"
            >
              Manage on GitHub
            </a>
          </li>
        </ul>
      </section>

      {showContactForm ? (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-lg font-semibold tracking-[-0.02em] text-foreground">
            Contact Form
          </h2>
          <p className="m-0 text-sm leading-6 text-muted-foreground">
            The delivery address for the Contact Form tool, shared by every
            subdomain you own — verify it once here, not once per subdomain.
          </p>
          <ContactEmailPanel
            githubEmail={email ?? ""}
            initialStatus={contactEmailStatus}
          />
        </section>
      ) : null}

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
