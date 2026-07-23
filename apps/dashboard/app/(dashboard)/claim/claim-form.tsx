"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, ExternalLink, Loader2, XCircle } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Input } from "@is-pinoy-dev/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
} from "@is-pinoy-dev/ui/components/input-group"
import { claimPortfolio, type ClaimInput } from "./actions"

const TEMPLATES: { value: ClaimInput["portfolio"]["template"]; label: string }[] = [
  { value: "terminal", label: "Terminal" },
  { value: "pixel-card", label: "Pixel Card" },
  { value: "minimal", label: "Minimal" },
]

const THEMES: { value: NonNullable<ClaimInput["portfolio"]["theme"]>; label: string }[] = [
  { value: "gold-dark", label: "Gold Dark" },
  { value: "mono", label: "Mono" },
  { value: "matrix", label: "Matrix" },
  { value: "midnight", label: "Midnight" },
  { value: "crimson", label: "Crimson" },
  { value: "sunset", label: "Sunset" },
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

  const previewUrl = `${PORTFOLIO_URL}/?preview=1&login=${encodeURIComponent(
    login,
  )}&template=${template}&theme=${theme}`

  function onSubmit() {
    setResult(null)
    startTransition(async () => {
      const res = await claimPortfolio({
        subdomain: normalized,
        portfolio: { template, theme },
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
        <InputGroup>
          <Input
            id="subdomain"
            value={subdomain}
            onChange={(e) => setSubdomain(e.target.value)}
            placeholder="your-name"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-invalid={subdomain.length > 0 && !valid}
          />
          <InputGroupAddon className="font-mono text-xs text-muted-foreground">
            .is-pinoy.dev
          </InputGroupAddon>
        </InputGroup>
        {subdomain.length > 0 && !valid ? (
          <p className="m-0 text-xs text-destructive">
            3–63 chars: lowercase letters, numbers, and hyphens only.
          </p>
        ) : null}
      </div>

      <Selector
        legend="Template"
        options={TEMPLATES}
        value={template}
        onChange={setTemplate}
      />

      <Selector
        legend="Theme"
        options={THEMES}
        value={theme}
        onChange={setTheme}
      />

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
  options,
  value,
  onChange,
}: {
  legend: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <fieldset className="m-0 flex flex-col gap-3 border-0 p-0">
      <legend className="mb-1 p-0 text-sm font-medium text-foreground">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant={value === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </fieldset>
  )
}
