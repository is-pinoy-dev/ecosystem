"use client"

import { useState, useTransition } from "react"
import {
  CheckCircle2,
  ExternalLink,
  Eye,
  Loader2,
  Lock,
  XCircle,
} from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  InputGroup,
  InputGroupAddon,
} from "@is-pinoy-dev/ui/components/input-group"
import {
  DEFAULT_THEME,
  DEFAULT_TEMPLATE,
  ModeBadge,
  PortfolioStyleFields,
  portfolioPreviewUrl,
  styleOption,
  themeOption,
} from "@/components/portfolio-style-fields"
import {
  isDesignerTemplate,
  type PortfolioTemplate,
  type PortfolioTheme,
} from "@/lib/portfolio-style"
import { claimPortfolio } from "./actions"

type Result = { ok: true; prUrl: string } | { ok: false; error: string } | null

/**
 * `subdomain` is the claimant's GitHub username, derived server-side. It is
 * shown, never edited: a hosted portfolio renders that GitHub profile, so the
 * address is a consequence of who is signed in rather than a choice. The
 * server action derives it from the session too — this prop only spares the
 * page a round trip to display it.
 */
export function ClaimForm({
  login,
  subdomain,
}: {
  login: string
  subdomain: string
}) {
  const [template, setTemplate] = useState<PortfolioTemplate>(DEFAULT_TEMPLATE)
  const [theme, setTheme] = useState<PortfolioTheme>(DEFAULT_THEME)
  const [result, setResult] = useState<Result>(null)
  const [pending, startTransition] = useTransition()

  const isDesigner = isDesignerTemplate(template)
  const selectedStyle = styleOption(template)
  const selectedTheme = themeOption(theme)

  const previewUrl = portfolioPreviewUrl(login, template, theme)

  function onSubmit() {
    if (pending) return
    setResult(null)
    startTransition(async () => {
      const response = await claimPortfolio({
        portfolio: isDesigner ? { template } : { template, theme },
      })
      setResult(response)
    })
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start xl:gap-14"
    >
      <div className="flex min-w-0 flex-col gap-12">
        <section
          aria-labelledby="claim-domain-heading"
          className="border-t border-border pt-5"
        >
          <StepHeading
            number="01"
            id="claim-domain-heading"
            title="Your address"
            description="A hosted portfolio is your GitHub profile, so it lives at your GitHub username."
          />
          <div className="mt-5 flex max-w-2xl flex-col gap-3">
            <span
              id="subdomain-label"
              className="text-sm font-medium text-foreground"
            >
              Subdomain
            </span>
            {/* Static text, not a disabled input: there is no value to edit
                here, and a disabled field invites people to hunt for the
                toggle that would enable it. */}
            <InputGroup
              role="group"
              aria-labelledby="subdomain-label"
              aria-describedby="subdomain-hint"
              className="h-12 bg-muted/35"
            >
              <span className="flex min-w-0 flex-1 items-center gap-2 px-4">
                <Lock
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="truncate font-mono text-sm text-foreground">
                  {subdomain}
                </span>
              </span>
              <InputGroupAddon className="border-input bg-muted/50 px-4 font-mono text-sm whitespace-nowrap text-muted-foreground">
                .is-pinoy.dev
              </InputGroupAddon>
            </InputGroup>
            <p
              id="subdomain-hint"
              className="m-0 text-xs text-muted-foreground"
            >
              Taken from your GitHub account (@{login}) and not editable. Sign
              in as a different account to claim a different address.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="claim-style-heading"
          className="border-t border-border pt-5"
        >
          <StepHeading
            number="02"
            id="claim-style-heading"
            title="Choose a portfolio style"
            description="Layouts can be recolored. Signature designs include their own layout, typography, and palette."
          />

          <div className="mt-6">
            <PortfolioStyleFields
              template={template}
              theme={theme}
              onTemplateChange={setTemplate}
              onThemeChange={setTheme}
            />
          </div>
        </section>
      </div>

      <aside className="lg:sticky lg:top-32">
        <div className="overflow-hidden border border-border bg-card">
          <div className="relative aspect-[16/10] overflow-hidden border-b border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/themes/${selectedStyle.value}.webp`}
              alt={`${selectedStyle.label} portfolio preview`}
              className="size-full object-cover object-top"
            />
            <span className="absolute top-3 left-3 bg-background px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.1em] text-foreground uppercase">
              Your selection
            </span>
          </div>

          <div className="flex flex-col gap-5 p-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="m-0 text-xl font-semibold tracking-[-0.025em] text-foreground">
                  {selectedStyle.label}
                </h2>
                {selectedStyle.mode ? (
                  <ModeBadge mode={selectedStyle.mode} />
                ) : (
                  <span className="font-mono text-[10px] font-semibold tracking-wide text-accent uppercase">
                    Layout
                  </span>
                )}
              </div>
              <p className="mt-1.5 mb-0 text-sm leading-5 text-muted-foreground">
                {selectedStyle.description}
              </p>
            </div>

            {!isDesigner ? (
              <div className="flex items-center justify-between gap-3 border-y border-border py-3 text-xs">
                <span className="text-muted-foreground">Color palette</span>
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <span
                    className="size-3 border border-border"
                    style={{ backgroundColor: selectedTheme.swatch }}
                    aria-hidden="true"
                  />
                  {selectedTheme.label}
                </span>
              </div>
            ) : null}

            <div className="bg-muted/45 p-3">
              <span className="block font-mono text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                Portfolio address
              </span>
              <span className="mt-1 block truncate font-mono text-sm text-foreground">
                {subdomain}.is-pinoy.dev
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={pending}
              >
                {pending ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Opening pull request…
                  </>
                ) : (
                  "Claim & open pull request"
                )}
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Eye aria-hidden="true" />
                  Preview with my GitHub
                  <ExternalLink
                    className="ml-auto size-3.5"
                    aria-hidden="true"
                  />
                </a>
              </Button>
            </div>

            <p className="m-0 text-xs leading-5 text-muted-foreground">
              Claiming opens a pull request. Your address goes live after a
              maintainer reviews and merges it.
            </p>
          </div>
        </div>

        {result?.ok === true ? (
          <div className="mt-3 flex items-start gap-3 border border-border bg-background p-4 text-sm text-foreground">
            <CheckCircle2
              className="mt-0.5 size-[18px] shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>
              Pull request opened.{" "}
              <a
                href={result.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline"
              >
                View pull request
              </a>
              .
            </span>
          </div>
        ) : null}

        {result?.ok === false ? (
          <div className="mt-3 flex items-start gap-3 border border-destructive/35 bg-destructive/5 p-4 text-sm text-foreground">
            <XCircle
              className="mt-0.5 size-[18px] shrink-0 text-destructive"
              aria-hidden="true"
            />
            <span>{result.error}</span>
          </div>
        ) : null}
      </aside>
    </form>
  )
}

function StepHeading({
  number,
  id,
  title,
  description,
}: {
  number: string
  id: string
  title: string
  description: string
}) {
  return (
    <div className="grid grid-cols-[32px_minmax(0,1fr)] gap-3">
      <span className="pt-1 font-mono text-xs font-semibold text-accent">
        {number}
      </span>
      <div>
        <h2
          id={id}
          className="m-0 text-lg font-semibold tracking-[-0.02em] text-foreground"
        >
          {title}
        </h2>
        <p className="mt-1 mb-0 max-w-2xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}
