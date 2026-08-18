"use client"

import { useState, useTransition } from "react"
import {
  CheckCircle2,
  ChevronRight,
  GitPullRequest,
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
import { Input } from "@is-pinoy-dev/ui/components/input"
import { StatusIndicator } from "@is-pinoy-dev/ui/components/status-indicator"
import { cn } from "@is-pinoy-dev/ui/lib/utils"

import {
  checkContactFormEmailStatus,
  verifyContactFormEmail,
} from "@/app/(dashboard)/domains/actions"
import type { DestinationAddressStatus } from "@/lib/cloudflare-email"
import type { PendingPRView } from "@/lib/domain-view"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function statusTone(status: DestinationAddressStatus): "success" | "warning" {
  return status === "verified" ? "success" : "warning"
}

function statusLabel(status: DestinationAddressStatus): string {
  if (status === "verified") return "Verified"
  if (status === "pending") return "Not verified — check your inbox"
  return "Not verified"
}

/**
 * The Contact Form feature's email prerequisite: an editable `owner.email`
 * field, the "Verify email" action that registers it with Cloudflare Email
 * Routing, and the verification status that gates the feature's switch in
 * the platform panel below (see lib/domain-view.ts's contactFormBlockReason).
 *
 * Deliberately its own panel rather than living inside the generic feature
 * switch — richer than an on/off toggle, the same way portfolio style earned
 * its own panel instead of being one more row in the platform list.
 */
export function ContactFormEmailPanel({
  subdomain,
  initialEmail,
  initialStatus,
  pendingPR,
}: {
  subdomain: string
  initialEmail: string
  initialStatus: DestinationAddressStatus
  pendingPR: PendingPRView | null
}) {
  const [email, setEmail] = useState(initialEmail)
  const [status, setStatus] = useState<DestinationAddressStatus>(initialStatus)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prUrl, setPrUrl] = useState<string | null>(null)
  const [verifying, startVerifying] = useTransition()
  const [rechecking, startRechecking] = useTransition()

  const readOnly = pendingPR !== null
  const validEmail = EMAIL_PATTERN.test(email.trim())
  const emailDirty = email.trim() !== initialEmail

  function onVerify() {
    if (!validEmail || readOnly) return
    setError(null)
    setPrUrl(null)
    startVerifying(async () => {
      const result = await verifyContactFormEmail({
        subdomain,
        email: email.trim(),
      })
      setStatus(result.status)
      if (result.prUrl) setPrUrl(result.prUrl)
      if (!result.ok) setError(result.error ?? "Could not verify this email.")
    })
  }

  function onRecheck() {
    if (!validEmail) return
    setError(null)
    startRechecking(async () => {
      const result = await checkContactFormEmailStatus({
        subdomain,
        email: email.trim(),
      })
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
            aria-label={`${open ? "Collapse" : "Expand"} contact email settings for ${subdomain}.is-pinoy.dev`}
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
                  ? "Required before the Contact Form tool can be switched on."
                  : initialEmail || "No email on file yet"}
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
          {readOnly ? (
            <p className="m-0 flex flex-wrap items-center gap-x-1.5 gap-y-1 border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
              <GitPullRequest
                className="size-3.5 shrink-0"
                aria-hidden="true"
              />
              A change for this domain is waiting in{" "}
              <a
                href={pendingPR.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                pull request #{pendingPR.number}
              </a>
              . Merge or close it before editing the email on file.
            </p>
          ) : null}

          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-foreground">
            Email address
            <Input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                setError(null)
              }}
              placeholder="you@example.com"
              disabled={readOnly || verifying}
              aria-invalid={email.length > 0 && !validEmail}
            />
          </label>

          <p className="m-0 border border-border bg-muted/40 p-3 text-[11px]/relaxed text-muted-foreground">
            We&rsquo;ll register {validEmail ? email.trim() : "this address"} as
            a verified destination in Cloudflare&rsquo;s Email Routing, so
            messages submitted through your contact form go straight to your
            inbox — nothing is stored on our servers. You&rsquo;ll get a
            one-time confirmation email from Cloudflare to complete this.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              onClick={onVerify}
              disabled={!validEmail || readOnly || verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Verifying…
                </>
              ) : (
                <>
                  <MailCheck aria-hidden="true" />
                  {emailDirty ? "Save & verify email" : "Verify email"}
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onRecheck}
              disabled={!validEmail || rechecking}
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
                Not verified yet — check {email.trim() || "your inbox"} for a
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
                Verified — the Contact Form tool can be switched on below.
              </span>
            </p>
          ) : null}

          {prUrl ? (
            <p className="m-0 flex items-start gap-2.5 border border-border p-3 text-xs/relaxed">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-success"
                aria-hidden="true"
              />
              <span>
                Pull request opened updating the email on file —{" "}
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  review it on GitHub
                </a>
                .
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
