"use client"

import { Check } from "lucide-react"

import { Button } from "@is-pinoy-dev/ui/components/button"
import { cn } from "@is-pinoy-dev/ui/lib/utils"

import {
  isDesignerTemplate,
  type PortfolioTemplate,
  type PortfolioTheme,
} from "@/lib/portfolio-style"

// The portfolio style picker, shared by the claim page and the restyle panel on
// a domain's detail page. Both write the same two fields of the same record
// block, so they present the same catalogue — a design added here shows up in
// both places, and neither can offer a template the other doesn't.

export interface StyleOption {
  value: PortfolioTemplate
  label: string
  description: string
  mode?: "Light" | "Dark" | "Color"
}

// Layout templates are re-colored by the palette picker.
export const LAYOUTS: StyleOption[] = [
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
export const DESIGNER: StyleOption[] = [
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

export const ALL_STYLES = [...LAYOUTS, ...DESIGNER]

export const THEMES: {
  value: PortfolioTheme
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

export const DEFAULT_TEMPLATE: PortfolioTemplate = "terminal"
export const DEFAULT_THEME: PortfolioTheme = "gold-dark"

const PORTFOLIO_URL =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "https://portfolio.is-pinoy.dev"

/** Look up a style's presentation, falling back to the default template. */
export function styleOption(template: PortfolioTemplate): StyleOption {
  return ALL_STYLES.find((option) => option.value === template) ?? LAYOUTS[0]!
}

export function themeOption(theme: PortfolioTheme) {
  return THEMES.find((option) => option.value === theme) ?? THEMES[0]!
}

/** Renderer preview of a style against a real GitHub profile, unsaved. */
export function portfolioPreviewUrl(
  login: string,
  template: PortfolioTemplate,
  theme: PortfolioTheme
): string {
  const base = `${PORTFOLIO_URL}/?preview=1&github=${encodeURIComponent(login)}&template=${template}`
  return isDesignerTemplate(template) ? base : `${base}&theme=${theme}`
}

const MODE_STYLES: Record<NonNullable<StyleOption["mode"]>, string> = {
  Light: "text-amber-700 border-amber-600/40 dark:text-amber-400",
  Dark: "text-blue-600 border-blue-500/40 dark:text-blue-400",
  Color: "text-pink-600 border-pink-500/40 dark:text-pink-400",
}

export function ModeBadge({
  mode,
}: {
  mode: NonNullable<StyleOption["mode"]>
}) {
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

/**
 * The whole choice: a layout plus a palette, or a designer design that carries
 * its own. The palette picker hides itself for a designer design rather than
 * rendering a control that would change nothing.
 */
export function PortfolioStyleFields({
  template,
  theme,
  onTemplateChange,
  onThemeChange,
  disabled = false,
}: {
  template: PortfolioTemplate
  theme: PortfolioTheme
  onTemplateChange: (value: PortfolioTemplate) => void
  onThemeChange: (value: PortfolioTheme) => void
  disabled?: boolean
}) {
  const isDesigner = isDesignerTemplate(template)

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col gap-4">
        <ThumbSelector
          legend="Flexible layouts"
          hint="Choose a structure, then make it yours with a color palette."
          options={LAYOUTS}
          value={template}
          onChange={onTemplateChange}
          disabled={disabled}
        />
        {!isDesigner ? (
          <div className="border border-border bg-muted/35 p-4">
            <Selector
              legend="Color palette"
              hint="Applied to your selected layout."
              options={THEMES}
              value={theme}
              onChange={onThemeChange}
              disabled={disabled}
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
        onChange={onTemplateChange}
        disabled={disabled}
      />
    </div>
  )
}

/** Visual picker: a grid of thumbnail cards, one per style. */
export function ThumbSelector({
  legend,
  hint,
  options,
  value,
  onChange,
  disabled = false,
}: {
  legend: string
  hint?: string
  options: StyleOption[]
  value: PortfolioTemplate
  onChange: (value: PortfolioTemplate) => void
  disabled?: boolean
}) {
  return (
    <fieldset
      disabled={disabled}
      className="m-0 flex flex-col gap-3 border-0 p-0 disabled:opacity-60"
    >
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

export function Selector<T extends string>({
  legend,
  hint,
  options,
  value,
  onChange,
  disabled = false,
}: {
  legend: string
  hint?: string
  options: { value: T; label: string; swatch?: string }[]
  value: T
  onChange: (value: T) => void
  disabled?: boolean
}) {
  return (
    <fieldset
      disabled={disabled}
      className="m-0 flex flex-col gap-3 border-0 p-0 disabled:opacity-60"
    >
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
