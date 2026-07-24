"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Input } from "@is-pinoy-dev/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
} from "@is-pinoy-dev/ui/components/input-group"
import { cn } from "@is-pinoy-dev/ui/lib/utils"
import { claimPortfolio, type ClaimInput } from "./actions"

type TemplateValue = ClaimInput["portfolio"]["template"]

// Layout templates are re-colored by the Theme picker below.
const LAYOUTS: { value: TemplateValue; label: string }[] = [
  { value: "terminal", label: "Terminal" },
  { value: "pixel-card", label: "Pixel Card" },
  { value: "minimal", label: "Minimal" },
]

// Designer themes are complete, self-contained designs (own layout, type, and
// colors) — they ignore the Theme picker.
const DESIGNER: { value: TemplateValue; label: string }[] = [
  { value: "concrete", label: "Concrete" },
  { value: "broadsheet", label: "Broadsheet" },
  { value: "phosphor", label: "Phosphor" },
  { value: "draft", label: "Draft" },
  { value: "bubblegum", label: "Bubblegum" },
  { value: "grid", label: "Grid" },
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

      <Selector
        legend="Layout"
        hint="Pick a layout, then a color theme below."
        options={LAYOUTS}
        value={template}
        onChange={setTemplate}
      />

      <Selector
        legend="Designer themes"
        hint="Complete designs — each brings its own layout, type, and colors (no separate theme)."
        options={DESIGNER}
        value={template}
        onChange={setTemplate}
      />

      {!isDesigner ? (
        <Selector
          legend="Theme"
          options={THEMES}
          value={theme}
          onChange={setTheme}
        />
      ) : null}

      <p className="-mt-4 m-0 text-xs text-muted-foreground">
        Not sure? Use{" "}
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline"
        >
          Preview
        </a>{" "}
        to see your README in this style before claiming.
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
