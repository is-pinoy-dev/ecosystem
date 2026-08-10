"use client"

import { useId, useState } from "react"
import Image from "next/image"
import { AlertTriangle, ArrowUpRight, Check } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Card, CardContent } from "@is-pinoy-dev/ui/components/card"
import { Input } from "@is-pinoy-dev/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
} from "@is-pinoy-dev/ui/components/input-group"

const PORTFOLIO_URL = "https://portfolio.is-pinoy.dev"

export interface PortfolioDesign {
  slug: string
  name: string
  description: string
  mode: string
  /**
   * Layout templates are re-colored by a palette; designer templates own their
   * colors and ignore `theme`, so the parameter is only sent when set.
   */
  theme?: string
}

// GitHub's own rule: alphanumerics and single inner hyphens, up to 39 chars.
const GITHUB_LOGIN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

/**
 * Accepts what people actually paste — `@juan`, a profile URL, a trailing
 * slash — and reduces it to the login the renderer expects.
 */
export function normalizeLogin(raw: string): string {
  return raw
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?github\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .trim()
}

export function isGitHubLogin(login: string): boolean {
  return GITHUB_LOGIN.test(login)
}

/**
 * The URL shape `apps/portfolio` answers in preview mode, and the same one the
 * dashboard's claim form builds: `theme` goes only to layout templates.
 */
export function previewUrl(login: string, design: PortfolioDesign): string {
  const params = new URLSearchParams({
    preview: "1",
    github: login,
    template: design.slug,
  })
  if (design.theme) params.set("theme", design.theme)
  return `${PORTFOLIO_URL}/?${params.toString()}`
}

export function PortfolioPreview({ designs }: { designs: PortfolioDesign[] }) {
  const [value, setValue] = useState("")
  const [selected, setSelected] = useState(designs[0]!.slug)
  const [invalid, setInvalid] = useState(false)
  const inputId = useId()
  const errorId = useId()

  const design = designs.find((item) => item.slug === selected) ?? designs[0]!

  const handleSubmit = () => {
    const login = normalizeLogin(value)
    if (!isGitHubLogin(login)) {
      setInvalid(true)
      return
    }

    setInvalid(false)
    // A preview is somebody else's page on another host — never the tab the
    // visitor is reading, and never with a live opener handle.
    window.open(previewUrl(login, design), "_blank", "noopener,noreferrer")
  }

  return (
    <div className="mt-8 border-y border-border py-7">
      <div className="grid gap-6 lg:grid-cols-[0.44fr_0.56fr] lg:gap-16">
        <div className="min-w-0">
          <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase">
            Try it with your profile
          </p>
          <p className="m-0 mt-3 max-w-[420px] text-[13px] leading-[1.6] text-muted-foreground">
            Enter your GitHub username and open a live preview in a new tab.
            Nothing is claimed, published, or saved — pick a design below and
            look before you decide.
          </p>
        </div>

        <form
          className="min-w-0"
          onSubmit={(event) => {
            event.preventDefault()
            handleSubmit()
          }}
        >
          <div className="flex flex-col gap-3 min-[560px]:flex-row">
            <InputGroup className="h-12 flex-1 bg-card">
              <InputGroupAddon className="border-r border-l-0 border-border px-3 font-mono text-sm text-muted-foreground">
                github.com/
              </InputGroupAddon>
              <Input
                id={inputId}
                type="text"
                aria-label="Your GitHub username"
                aria-invalid={invalid}
                aria-describedby={invalid ? errorId : undefined}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  if (invalid) setInvalid(false)
                }}
                placeholder="yourname"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="h-auto min-w-0 flex-1 border-0 bg-transparent px-3 font-mono text-base text-foreground shadow-none outline-none focus-visible:border-transparent focus-visible:outline-none"
              />
            </InputGroup>
            <Button type="submit" className="h-12 shrink-0 gap-2 px-5">
              Preview in {design.name}
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          {invalid ? (
            <p
              id={errorId}
              className="m-0 mt-2.5 flex items-center gap-2 text-xs text-destructive"
            >
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
              Enter a GitHub username — letters, numbers, and single hyphens.
            </p>
          ) : (
            <p className="m-0 mt-2.5 text-xs leading-[1.5] text-muted-foreground">
              Your profile README renders as-is. A profile without one still
              previews with your bio, links, and repositories.
            </p>
          )}
        </form>
      </div>

      <fieldset className="m-0 mt-7 border-0 p-0">
        <legend className="sr-only">
          Choose a portfolio design to preview
        </legend>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((item, index) => {
            const isSelected = item.slug === design.slug
            return (
              <label
                key={item.slug}
                // Six full-width previews is a long scroll on a phone; the last
                // three appear once the grid can place two per row.
                className={`group cursor-pointer ${index < 3 ? "" : "hidden sm:block"}`}
              >
                <input
                  type="radio"
                  name="portfolio-design"
                  value={item.slug}
                  checked={isSelected}
                  onChange={() => setSelected(item.slug)}
                  className="peer sr-only"
                />
                <Card
                  className={`overflow-hidden bg-card py-0 transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-focus-visible:outline-solid ${
                    isSelected
                      ? "border-accent"
                      : "border-border group-hover:border-accent/50"
                  }`}
                >
                  <div className="relative aspect-[640/400] overflow-hidden border-b border-border bg-muted">
                    <Image
                      src={`/themes/${item.slug}.webp`}
                      alt={`The ${item.name} portfolio design`}
                      width={640}
                      height={400}
                      loading={index < 3 ? "eager" : "lazy"}
                      sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
                      className="h-full w-full object-cover object-top"
                    />
                    {isSelected ? (
                      <span className="absolute top-2 right-2 flex items-center gap-1 border border-accent bg-background px-2 py-1 font-mono text-[10px] font-semibold tracking-[0.06em] text-accent uppercase">
                        <Check className="size-3" aria-hidden="true" />
                        Selected
                      </span>
                    ) : null}
                  </div>
                  <CardContent className="flex items-start justify-between gap-3 px-4 py-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-foreground">
                        {item.name}
                      </span>
                      <span className="mt-1 block text-[13px] leading-[1.5] text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <Badge variant="outline" className="shrink-0">
                      {item.mode}
                    </Badge>
                  </CardContent>
                </Card>
              </label>
            )
          })}
        </div>
      </fieldset>

      <p className="m-0 mt-4 font-mono text-xs text-muted-foreground">
        Twelve designs available today. Six shown here — the rest are in the
        dashboard when you claim.
      </p>
    </div>
  )
}
