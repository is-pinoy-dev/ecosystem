"use client"

import { useState, useTransition } from "react"
import { Check, CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Input } from "@is-pinoy-dev/ui/components/input"
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
  mode?: "Light" | "Dark" | "Color"
}

// Layout templates are re-colored by the Theme picker below.
const LAYOUTS: StyleOption[] = [
  { value: "terminal", label: "Terminal" },
  { value: "pixel-card", label: "Pixel Card" },
  { value: "minimal", label: "Minimal" },
]

// Designer themes are complete, self-contained designs (own layout, type, and
// colors) — they ignore the Theme picker.
const DESIGNER: StyleOption[] = [
  { value: "concrete", label: "Concrete", mode: "Light" },
  { value: "broadsheet", label: "Broadsheet", mode: "Light" },
  { value: "phosphor", label: "Phosphor", mode: "Dark" },
  { value: "draft", label: "Draft", mode: "Dark" },
  { value: "bubblegum", label: "Bubblegum", mode: "Color" },
  { value: "grid", label: "Grid", mode: "Light" },
]

const DESIGNER_SET = new Set<TemplateValue>(DESIGNER.map((d) => d.value))

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

export function ClaimForm({ login }: { login: string }) {
  const [subdomain, setSubdomain] = useState("")
  const [template, setTemplate] =
    useState<ClaimInput["portfolio"]["template"]>("terminal")
  const [theme, setTheme] =
    useState<NonNullable<ClaimInput["portfolio"]["theme"]>>("gold-dark")
  const [result, setResult] = useState<Result>(null)
  const [pending, startTransition] = useTransition()

  const normalized = subdomain.trim().toLowerCase()
  const valid = /^[a-z0-9-]{3,63}$/.test(normalized)
  const showInvalid = subdomain.length > 0 && !valid
  const isDesigner = DESIGNER_SET.has(template)

  const previewUrl =
    `${PORTFOLIO_URL}/?preview=1&login=${encodeURIComponent(login)}&template=${template}` +
    (isDesigner ? "" : `&theme=${theme}`)

  function onSubmit() {
    setResult(null)
    startTransition(async () => {
      const res = await claimPortfolio({
        subdomain: normalized,
        portfolio: isDesigner ? { template } : { template, theme },
      })
      setResult(res)
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <label htmlFor="subdomain" className="text-sm font-medium text-foreground">
          Subdomain
        </label>
        <InputGroup
          className={cn(
            "h-12 bg-card",
            showInvalid && "border-destructive focus-within:border-destructive",
          )}
        >
          <Input
            id="subdomain"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            placeholder="your-name"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={showInvalid}
            className="h-auto min-w-0 flex-1 border-0 bg-transparent px-4 font-mono text-sm text-foreground shadow-none outline-none focus-visible:border-transparent focus-visible:outline-none"
          />
          <InputGroupAddon className="border-input bg-muted/50 px-4 font-mono text-sm whitespace-nowrap text-muted-foreground">
            .is-pinoy.dev
          </InputGroupAddon>
        </InputGroup>
        {showInvalid ? (
          <p className="m-0 text-xs text-destructive">
            3–63 characters: lowercase letters, numbers, and hyphens only.
          </p>
        ) : (
          <p className="m-0 text-xs text-muted-foreground">
            This becomes{" "}
            <span className="font-mono text-foreground">
              {normalized || "your-name"}.is-pinoy.dev
            </span>
            .
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">Choose a style</span>
        <p className="m-0 text-xs text-muted-foreground">
          Pick <span className="font-medium text-foreground">one</span>. A{" "}
          <span className="font-medium text-foreground">layout</span> lets you also
          pick a color; a{" "}
          <span className="font-medium text-foreground">designer theme</span> is a
          complete look with its own colors.
        </p>
      </div>

      <div className="flex flex-col gap-4 border-l-2 border-border pl-4">
        <ThumbSelector
          legend="Option A — a layout + color"
          hint="Previews shown in Gold Dark."
          options={LAYOUTS}
          value={template}
          onChange={setTemplate}
        />
        {!isDesigner ? (
          <Selector
            legend="Color"
            options={THEMES}
            value={theme}
            onChange={setTheme}
          />
        ) : null}
      </div>

      <div className="flex items-center gap-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="border-l-2 border-border pl-4">
        <ThumbSelector
          legend="Option B — a designer theme"
          hint="Each is a complete design with its own layout, type, and colors."
          options={DESIGNER}
          value={template}
          onChange={setTemplate}
        />
      </div>

      <p className="m-0 text-xs text-muted-foreground">
        Not sure? Use{" "}
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          Preview
        </a>{" "}
        to see your README in the selected style before claiming.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={onSubmit} disabled={!valid || pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Opening pull request…
            </>
          ) : (
            "Claim & open pull request"
          )}
        </Button>
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent no-underline hover:underline"
        >
          Preview
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>

      {result?.ok === true ? (
        <div className="flex items-start gap-3 border border-border bg-background p-4 text-sm text-foreground">
          <CheckCircle2 className="mt-0.5 size-[18px] shrink-0 text-primary" aria-hidden="true" />
          <span>
            Pull request opened. Once a maintainer merges it,{" "}
            <span className="font-mono">{normalized}.is-pinoy.dev</span> goes live.{" "}
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
        <div className="flex items-start gap-3 border border-destructive/35 bg-destructive/5 p-4 text-sm text-foreground">
          <XCircle className="mt-0.5 size-[18px] shrink-0 text-destructive" aria-hidden="true" />
          <span>{result.error}</span>
        </div>
      ) : null}
    </div>
  )
}

const MODE_STYLES: Record<NonNullable<StyleOption["mode"]>, string> = {
  Light: "text-amber-600 border-amber-600/40",
  Dark: "text-blue-500 border-blue-500/40",
  Color: "text-pink-500 border-pink-500/40",
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
      <legend className="p-0 text-sm font-medium text-foreground">{legend}</legend>
      {hint ? <p className="m-0 -mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {options.map((option) => {
          const selected = value === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
              className={cn(
                "group flex flex-col overflow-hidden border bg-card text-left transition-colors focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                selected
                  ? "border-primary ring-2 ring-primary"
                  : "border-border hover:border-foreground/30",
              )}
            >
              <span className="relative block aspect-[16/10] overflow-hidden border-b border-border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/themes/${option.value}.webp`}
                  alt={`${option.label} preview`}
                  loading="lazy"
                  className="size-full object-cover object-top"
                />
                {selected ? (
                  <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center bg-primary text-primary-foreground">
                    <Check className="size-3.5" aria-hidden="true" />
                  </span>
                ) : null}
              </span>
              <span className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-sm font-medium text-foreground">{option.label}</span>
                {option.mode ? (
                  <span
                    className={cn(
                      "border px-1.5 py-0.5 font-mono text-[10px] tracking-wide uppercase",
                      MODE_STYLES[option.mode],
                    )}
                  >
                    {option.mode}
                  </span>
                ) : null}
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
      {hint ? <p className="m-0 -mt-1 text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value
          return (
            <Button
              key={option.value}
              type="button"
              variant={selected ? "default" : "outline"}
              onClick={() => onChange(option.value)}
              aria-pressed={selected}
            >
              {option.swatch ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-3.5 shrink-0 border",
                    selected ? "border-primary-foreground/40" : "border-border",
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
