"use client"

import { useState, useTransition } from "react"
import {
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Eye,
  GitPullRequest,
  Loader2,
  XCircle,
} from "lucide-react"

import { Button } from "@is-pinoy-dev/ui/components/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@is-pinoy-dev/ui/components/collapsible"
import { cn } from "@is-pinoy-dev/ui/lib/utils"

import {
  savePortfolioStyle,
  type SubdomainSaveResult,
} from "@/app/(dashboard)/domains/actions"
import {
  DEFAULT_THEME,
  ModeBadge,
  PortfolioStyleFields,
  portfolioPreviewUrl,
  styleOption,
  themeOption,
} from "@/components/portfolio-style-fields"
import {
  isDesignerTemplate,
  sameStyle,
  type PortfolioStyle,
  type PortfolioTemplate,
  type PortfolioTheme,
} from "@/lib/portfolio-style"
import type { PendingPRView } from "@/lib/domain-view"

/**
 * Restyle a hosted portfolio.
 *
 * Same contract as the platform switches: choosing a style changes nothing on
 * its own, and saving opens a pull request against the record file. While one
 * is open the panel is read-only, because git — not this page — decides what
 * the renderer serves.
 */
export function PortfolioStylePanel({
  subdomain,
  login,
  style,
  pendingPR,
}: {
  subdomain: string
  login: string
  style: PortfolioStyle
  pendingPR: PendingPRView | null
}) {
  const [template, setTemplate] = useState<PortfolioTemplate>(style.template)
  // A designer design saves no palette, so there is none to restore when the
  // owner moves back to a layout — start those from the default rather than
  // from nothing.
  const [theme, setTheme] = useState<PortfolioTheme>(
    style.theme ?? DEFAULT_THEME
  )
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<SubdomainSaveResult | null>(null)
  const [saving, startSaving] = useTransition()

  const readOnly = pendingPR !== null
  const dirty = !sameStyle(style, { template, theme })
  const current = styleOption(style.template)
  const staged = styleOption(template)
  const currentSummary = [
    current.label,
    style.theme && !isDesignerTemplate(style.template)
      ? themeOption(style.theme).label
      : null,
  ]
    .filter(Boolean)
    .join(" · ")

  function onSave() {
    if (!dirty || readOnly) return
    setResult(null)
    startSaving(async () => {
      setResult(
        await savePortfolioStyle({
          subdomain,
          template,
          ...(isDesignerTemplate(template) ? {} : { theme }),
        })
      )
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
            aria-label={`${open ? "Collapse" : "Expand"} portfolio style for ${subdomain}.is-pinoy.dev`}
          >
            <ChevronRight
              className={cn(
                "size-3.5 shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90"
              )}
              aria-hidden="true"
            />
            <span className="hidden h-11 w-[70px] shrink-0 overflow-hidden border border-border sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/themes/${style.template}.webp`}
                alt=""
                className="size-full object-cover object-top"
              />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                Portfolio style
                {dirty && !readOnly ? (
                  <span className="text-[11px] font-medium text-primary">
                    Unsaved
                  </span>
                ) : null}
              </span>
              <span className="truncate text-[11px]/relaxed text-muted-foreground">
                {open
                  ? "Your profile content stays the same — this only changes how it is presented."
                  : currentSummary}
              </span>
            </span>
          </button>
        </CollapsibleTrigger>
        {current.mode ? <ModeBadge mode={current.mode} /> : null}
      </div>

      <CollapsibleContent>
        <div className="flex flex-col gap-6 border-t border-border p-4">
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
              . Merge or close it before restyling.
            </p>
          ) : null}

          <PortfolioStyleFields
            template={template}
            theme={theme}
            onTemplateChange={setTemplate}
            onThemeChange={setTheme}
            disabled={readOnly || saving}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="m-0 max-w-md text-[11px]/relaxed text-muted-foreground">
              {dirty
                ? `Saving opens a pull request switching ${subdomain}.is-pinoy.dev to ${staged.label}. It goes live once a maintainer merges it.`
                : "This is the style your portfolio is serving now."}
            </p>
            <span className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a
                  href={portfolioPreviewUrl(login, template, theme)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Eye aria-hidden="true" />
                  Preview
                  <ExternalLink className="size-3.5" aria-hidden="true" />
                </a>
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={!dirty || readOnly || saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Opening…
                  </>
                ) : (
                  <>
                    <GitPullRequest aria-hidden="true" />
                    Open pull request
                  </>
                )}
              </Button>
            </span>
          </div>

          {result?.ok ? (
            <p className="m-0 flex items-start gap-2.5 border border-border p-3 text-xs/relaxed">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-success"
                aria-hidden="true"
              />
              <span>
                Pull request opened —{" "}
                <a
                  href={result.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline"
                >
                  review it on GitHub
                </a>
                . Your portfolio keeps its current look until it is merged.
              </span>
            </p>
          ) : null}

          {result && !result.ok ? (
            <p className="m-0 flex items-start gap-2.5 border border-destructive/35 bg-destructive/5 p-3 text-xs/relaxed">
              <XCircle
                className="mt-0.5 size-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <span>{result.error}</span>
            </p>
          ) : null}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
