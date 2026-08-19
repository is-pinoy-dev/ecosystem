"use client"

import { useState, useTransition } from "react"
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  MailCheck,
  RefreshCw,
  XCircle,
} from "lucide-react"

import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@is-pinoy-dev/ui/components/collapsible"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"
import { cn } from "@is-pinoy-dev/ui/lib/utils"

import {
  checkContactEmailStatus,
  verifyContactEmail,
} from "@/app/(dashboard)/account/actions"
import type { DestinationAddressStatus } from "@/lib/cloudflare-email"

function statusTone(status: DestinationAddressStatus): "success" | "warning" {
  return status === "verified" ? "success" : "warning"
}

function statusLabel(status: DestinationAddressStatus): string {
  if (status === "verified") return "Verified"
  if (status === "pending") return "Not verified — check your inbox"
  return "Not verified"
}

/**
 * The Contact Form feature's email prerequisite: shows the signed-in
 * account's GitHub email, the "Verify email" action that registers it as a
 * Cloudflare Email Routing destination for this account, and the
 * verification status that gates the feature's switch on every subdomain
 * this account owns (see lib/domain-view.ts's contactFormBlockReason).
 *
 * Account-scoped, not subdomain-scoped: Cloudflare Email Routing's own
 * destination-address list is account-wide, so there is exactly one address
 * to verify no matter how many subdomains this account owns. The address is
 * stored in the dashboard's `contact_emails` D1 table (lib/contact-email.ts)
 * — never git, and never a per-subdomain field.
 *
 * There is deliberately no editable email field here — `verifyContactEmail`
 * always uses the caller's own `session.user.email`, never a client-supplied
 * string. An earlier version of this panel let the owner type any address,
 * which is how a stale, unrelated field ended up registered in production
 * instead of the signed-in owner's actual GitHub email. Locking this to the
 * OAuth session is what fixes that: the address here is never anything other
 * than "whatever GitHub currently reports for this account."
 */
export function ContactEmailPanel({
  githubEmail,
  initialStatus,
}: {
  /** The signed-in account's current GitHub email, or "" if GitHub has none on file. */
  githubEmail: string
  initialStatus: DestinationAddressStatus
}) {
  const [status, setStatus] = useState<DestinationAddressStatus>(initialStatus)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifying, startVerifying] = useTransition()
  const [rechecking, startRechecking] = useTransition()

  const hasGithubEmail = githubEmail.length > 0

  function onVerify() {
    if (!hasGithubEmail) return
    setError(null)
    startVerifying(async () => {
      const result = await verifyContactEmail()
      setStatus(result.status)
      if (!result.ok) setError(result.error ?? "Could not verify this email.")
    })
  }

  function onRecheck() {
    setError(null)
    startRechecking(async () => {
      const result = await checkContactEmailStatus()
      if ("error" in result) {
        setError(result.error)
        return
      }
      setStatus(result.status)
    })
  }

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="flex flex-col border border-border bg-card"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pr-4">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-w-0 flex-1 items-center gap-3 border-0 bg-transparent py-3 pl-4 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring focus-visible:outline-solid"
            aria-label={`${open ? "Collapse" : "Expand"} contact email settings`}
          >
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90"
              )}
              aria-hidden="true"
            />
            <MailCheck
              className="hidden size-5 shrink-0 text-muted-foreground sm:block"
              aria-hidden="true"
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">
                Contact email
              </span>
              <span className="truncate text-[11px]/relaxed text-muted-foreground">
                {open
                  ? "Required before the Contact Form tool can be switched on for any subdomain."
                  : githubEmail || "No GitHub email on file"}
              </span>
            </span>
          </button>
        </CollapsibleTrigger>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground">
          <StatusIndicator tone={statusTone(status)} className="size-1.5" />
          {statusLabel(status)}
        </span>
      </div>

      <CollapsibleContent>
        <div className="flex flex-col gap-4 border-t border-border p-4">
          <div className="flex flex-col gap-1.5 text-[13px] font-medium text-foreground">
            GitHub account email
            {hasGithubEmail ? (
              <p className="m-0 border border-border bg-muted/40 px-3 py-2 font-mono text-[13px] font-normal text-foreground">
                {githubEmail}
              </p>
            ) : (
              <p className="m-0 border border-destructive/35 bg-destructive/5 px-3 py-2 text-[11px] font-normal text-muted-foreground">
                Your GitHub account has no email address available. Add a
                public or primary email to your GitHub account, then sign out
                and back in.
              </p>
            )}
          </div>

          <p className="m-0 border border-border bg-muted/40 p-3 text-[11px]/relaxed text-muted-foreground">
            This is always your current GitHub account email — there is no
            separate address to type or edit here. We&rsquo;ll register it as
            a verified destination in Cloudflare&rsquo;s Email Routing, so
            messages submitted through any contact form on a subdomain you own
            go straight to your inbox. It is never published, committed to
            the public domains repository, or shown to visitors.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={onVerify}
              disabled={!hasGithubEmail || verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Verifying…
                </>
              ) : (
                <>
                  <MailCheck aria-hidden="true" />
                  Verify email
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onRecheck}
              disabled={rechecking}
            >
              {rechecking ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw aria-hidden="true" />
              )}
              Recheck
            </Button>
          </div>

          {status === "pending" ? (
            <p className="m-0 flex items-start gap-2.5 border border-warning/35 bg-warning/5 p-3 text-xs/relaxed">
              <StatusIndicator
                tone="warning"
                className="mt-1 size-1.5 shrink-0"
              />
              <span>
                Not verified yet — check {githubEmail || "your inbox"} for a
                confirmation email from Cloudflare, then press Recheck.
              </span>
            </p>
          ) : null}

          {status === "verified" ? (
            <p className="m-0 flex items-start gap-2.5 border border-border p-3 text-xs/relaxed">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-success"
                aria-hidden="true"
              />
              <span>
                Verified — the Contact Form tool can be switched on for any
                subdomain you own.
              </span>
            </p>
          ) : null}

          {error ? (
            <p className="m-0 flex items-start gap-2.5 border border-destructive/35 bg-destructive/5 p-3 text-xs/relaxed">
              <XCircle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <span>{error}</span>
            </p>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
