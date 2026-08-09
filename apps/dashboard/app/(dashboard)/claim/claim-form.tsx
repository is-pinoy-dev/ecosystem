"use client"

import { useState, useTransition } from "react"
import {
  Check,
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
import { cn } from "@is-pinoy-dev/ui/lib/utils"
import { claimPortfolio, type ClaimInput } from "./actions"

type TemplateValue = ClaimInput["portfolio"]["template"]

interface StyleOption {
  value: TemplateValue
  label: string
  description: string
  mode?: "Light" | "Dark" | "Color"
}

// Layout templates are re-colored by the palette picker.
const LAYOUTS: StyleOption[] = [
  {
    value: "terminal",
    label: "Terminal",
    description: "Classic command-line profile",
  },
  {
    value: "pixel-card",
    label: "Pixel Card",
    description: "Retro cards, stats, and projects",
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Quiet, README-first typography",
  },
]

// Designer themes are complete, self-contained designs. They own their layout,
// typography, and colors, so the palette picker does not apply to them.
const DESIGNER: StyleOption[] = [
  {
    value: "concrete",
    label: "Concrete",
    description: "Bold brutalist type and rules",
    mode: "Light",
  },
  {
    value: "broadsheet",
    label: "Broadsheet",
    description: "Warm editorial journal",
    mode: "Light",
  },
  {
    value: "phosphor",
    label: "Phosphor",
    description: "CRT glow and shell commands",
    mode: "Dark",
  },
  {
    value: "draft",
    label: "Draft",
    description: "Technical blueprint system",
    mode: "Dark",
  },
  {
    value: "bubblegum",
    label: "Bubblegum",
    description: "Playful Y2K sticker cards",
    mode: "Color",
  },
  {
    value: "grid",
    label: "Grid",
    description: "Precise Swiss project index",
    mode: "Light",
  },
  {
    value: "bento",
    label: "Bento",
    description: "Soft, modern modular profile",
    mode: "Light",
  },
  {
    value: "noir",
    label: "Noir",
    description: "Cinematic monochrome portfolio",
    mode: "Dark",
  },
  {
    value: "solar",
    label: "Solar",
    description: "Vivid retro-future poster",
    mode: "Color",
  },
]

const ALL_STYLES = [...LAYOUTS, ...DESIGNER]
const DESIGNER_SET = new Set<TemplateValue>(
  DESIGNER.map((design) => design.value)
)

const THEMES: {
  value: NonNullable<ClaimInput["portfolio"]["theme"]>
  label: string
  swatch: string
}[] = [
  { value: "gold-dark", label: "Gold Dark", swatch: "#f5c800" },
  { value: "mono", label: "Mono", swatch: "#b8bcc4" },
  { value: "matrix", label: "Matrix", swatch: "#39ff14" },
  { value: "midnight", label: "Midnight", swatch: "#7c9cff" },
  { value: "crimson", label: "Crimson", swatch: "#ff5470" },
  { value: "sunset", label: "Sunset", swatch: "#ff8c42" },
]

const PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "https://portfolio.is-pinoy.dev"

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
  const [template, setTemplate] =
    useState<ClaimInput["portfolio"]["template"]>("terminal")
  const [theme, setTheme] =
    useState<NonNullable<ClaimInput["portfolio"]["theme"]>>("gold-dark")
  const [result, setResult] = useState<Result>(null)
  const [pending, startTransition] = useTransition()

  const isDesigner = DESIGNER_SET.has(template)
  const selectedStyle = ALL_STYLES.find((option) => option.value === template)!
  const selectedTheme = THEMES.find((option) => option.value === theme)!

  const previewUrl =
    `${PORTFOLIO_URL}/?preview=1&github=${encodeURIComponent(login)}&template=${template}` +
    (isDesigner ? "" : `&theme=${theme}`)

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
            <p id="subdomain-hint" className="m-0 text-xs text-muted-foreground">
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

          <div className="mt-6 flex flex-col gap-7">
            <div className="flex flex-col gap-4">
              <ThumbSelector
                legend="Flexible layouts"
                hint="Choose a structure, then make it yours with a color palette."
                options={LAYOUTS}
                value={template}
                onChange={setTemplate}
              />
              {!isDesigner ? (
                <div className="border border-border bg-muted/35 p-4">
                  <Selector
                    legend="Color palette"
                    hint="Applied to your selected layout."
                    options={THEMES}
                    value={theme}
                    onChange={setTheme}
                  />
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-3 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              <span className="h-px flex-1 bg-border" />
              or choose a complete look
              <span className="h-px flex-1 bg-border" />
            </div>

            <ThumbSelector
              legend="Signature designs"
              hint="Nine art-directed themes, including three new looks."
              options={DESIGNER}
              value={template}
              onChange={setTemplate}
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

const MODE_STYLES: Record<NonNullable<StyleOption["mode"]>, string> = {
  Light: "text-amber-700 border-amber-600/40 dark:text-amber-400",
  Dark: "text-blue-600 border-blue-500/40 dark:text-blue-400",
  Color: "text-pink-600 border-pink-500/40 dark:text-pink-400",
}

function ModeBadge({ mode }: { mode: NonNullable<StyleOption["mode"]> }) {
  return (
    <span
      className={cn(
        "border px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase",
        MODE_STYLES[mode]
      )}
    >
      {mode}
    </span>
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

/** Visual picker: a grid of thumbnail cards, one per style. */
function ThumbSelector({
  legend,
  hint,
  options,
  value,
  onChange,
}: {
  legend: string
  hint?: string
  options: StyleOption[]
  value: TemplateValue
  onChange: (value: TemplateValue) => void
}) {
  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className="p-0 text-sm font-medium text-foreground">
        {legend}
      </legend>
      {hint ? (
        <p className="m-0 -mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={cn(
                "group flex min-w-0 flex-col overflow-hidden border bg-card text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:outline-solid",
                selected
                  ? "border-primary ring-2 ring-primary"
                  : "border-border hover:border-foreground/30"
              )}
            >
              <span className="relative block aspect-[16/10] overflow-hidden border-b border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/themes/${option.value}.webp`}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover object-top transition-transform duration-200 group-hover:scale-[1.02]"
                />
                {selected ? (
                  <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                ) : null}
              </span>
              <span className="flex min-h-[76px] flex-col gap-1 px-3 py-2.5">
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="min-w-0 text-sm font-medium text-foreground">
                    {option.label}
                  </span>
                  {option.mode ? <ModeBadge mode={option.mode} /> : null}
                </span>
                <span className="text-xs leading-4 text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function Selector<T extends string>({
  legend,
  hint,
  options,
  value,
  onChange,
}: {
  legend: string
  hint?: string
  options: { value: T; label: string; swatch?: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className="p-0 text-sm font-medium text-foreground">
        {legend}
      </legend>
      {hint ? (
        <p className="m-0 -mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value
          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={selected ? "default" : "outline"}
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
            >
              {option.swatch ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-3 shrink-0 border",
                    selected ? "border-primary-foreground/40" : "border-border"
                  )}
                  style={{ backgroundColor: option.swatch }}
                />
              ) : null}
              {option.label}
            </Button>
          )
        })}
      </div>
    </fieldset>
  )
}
