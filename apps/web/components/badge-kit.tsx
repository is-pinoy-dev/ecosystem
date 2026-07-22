"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Input } from "@is-pinoy-dev/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
} from "@is-pinoy-dev/ui/components/input-group"
import { cn } from "@is-pinoy-dev/ui/lib/utils"

// The badges are rendered by the canonical Cloudflare Worker (see
// packages/badge-kit). This page is only the showcase: it previews the worker's
// output and hands users copy-paste snippets. `preview=true` lets the sample
// handle render without a real registry lookup; the copied snippets omit it so
// they verify the handle in production.
const WORKER = "https://badges.is-pinoy.dev"

type Theme = "light" | "dark" | "gold" | "outlined"
type Format = "markdown" | "html" | "url"

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "gold", label: "Gold" },
  { value: "outlined", label: "Outlined" },
]

const FORMAT_OPTIONS: { value: Format; label: string }[] = [
  { value: "markdown", label: "Markdown" },
  { value: "html", label: "HTML" },
  { value: "url", label: "URL" },
]

const ICON_OPTIONS: { value: "on" | "off"; label: string }[] = [
  { value: "on", label: "On" },
  { value: "off", label: "Off" },
]

interface BadgeItem {
  id: string
  name: string
  description: string
  needsHandle: boolean
  buildPath: (handle: string, theme: Theme, preview: boolean) => string
  alt: string
  buildLink: (handle: string) => string
}

const ITEMS: BadgeItem[] = [
  {
    id: "deployed-on",
    name: "Deployed on",
    description: "For a project or README living on your subdomain.",
    needsHandle: true,
    buildPath: (handle, theme, preview) =>
      `/badge/${handle}?type=subdomain&theme=${theme}${preview ? "&preview=true" : ""}`,
    alt: "Deployed on is-pinoy.dev",
    buildLink: (handle) => `https://${handle}.is-pinoy.dev`,
  },
  {
    id: "member",
    name: "Community member",
    description: "A compact inline chip for a bio, footer, or profile.",
    needsHandle: true,
    buildPath: (handle, theme, preview) =>
      `/badge/${handle}?type=member&theme=${theme}${preview ? "&preview=true" : ""}`,
    alt: "is-pinoy.dev community member",
    buildLink: (handle) => `https://${handle}.is-pinoy.dev`,
  },
  {
    id: "pinoy-made",
    name: "Pinoy-made",
    description: "An origin stamp — no handle needed.",
    needsHandle: false,
    buildPath: (_handle, theme) => `/badge?type=pinoy-made&theme=${theme}`,
    alt: "Pinoy-made",
    buildLink: () => "https://is-pinoy.dev",
  },
  {
    id: "certified",
    name: "Certified Pinoy Dev",
    description: "Wear the seal on your GitHub profile.",
    needsHandle: false,
    buildPath: (_handle, theme) => `/badge?type=certified&theme=${theme}`,
    alt: "Certified Pinoy Dev",
    buildLink: () => "https://is-pinoy.dev",
  },
  {
    id: "readme-banner",
    name: "README banner",
    description: "A wide block for the top of your README.",
    needsHandle: true,
    buildPath: (handle, theme, preview) =>
      `/banner/${handle}?type=readme&theme=${theme}${preview ? "&preview=true" : ""}`,
    alt: "Deployed on is-pinoy.dev",
    buildLink: (handle) => `https://${handle}.is-pinoy.dev`,
  },
  {
    id: "profile-banner",
    name: "Profile banner",
    description: "A hero block for your GitHub profile or portfolio.",
    needsHandle: true,
    buildPath: (handle, theme, preview) =>
      `/banner/${handle}?type=profile&theme=${theme}${preview ? "&preview=true" : ""}`,
    alt: "Pinoy Dev on the is-pinoy.dev network",
    buildLink: (handle) => `https://${handle}.is-pinoy.dev`,
  },
]

function sanitizeHandle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
}

function snippet(format: Format, url: string, alt: string, link: string): string {
  switch (format) {
    case "html":
      return `<a href="${link}"><img alt="${alt}" src="${url}" /></a>`
    case "url":
      return url
    default:
      return `[![${alt}](${url})](${link})`
  }
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        {label}
      </span>
      <div
        role="group"
        aria-label={label}
        className="inline-flex border border-border"
      >
        {options.map((option, index) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 px-3 font-mono text-xs font-medium transition-colors duration-[140ms]",
              index > 0 && "border-l border-border",
              value === option.value
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground hover:bg-muted",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy snippet"}
    >
      {copied ? (
        <Check className="text-success" aria-hidden="true" />
      ) : (
        <Copy aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  )
}

function CodeBlock({ value }: { value: string }) {
  return (
    <div className="flex items-stretch justify-between gap-3 border border-border bg-code-bg">
      <pre className="min-w-0 flex-1 overflow-x-auto px-3 py-2.5">
        <code className="font-mono text-xs break-all text-[#E7ECF5]">
          {value}
        </code>
      </pre>
      <div className="flex shrink-0 items-center border-l border-white/10 px-2">
        <CopyButton value={value} />
      </div>
    </div>
  )
}

export function BadgeKit() {
  const [theme, setTheme] = useState<Theme>("light")
  const [format, setFormat] = useState<Format>("markdown")
  const [icon, setIcon] = useState<"on" | "off">("on")
  const [handleInput, setHandleInput] = useState("")

  const handle = sanitizeHandle(handleInput) || "juan"
  const iconParam = icon === "off" ? "&icon=false" : ""

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-5 border-y border-border py-5">
        <InputGroup className="min-h-10 max-w-sm">
          <Input
            value={handleInput}
            onChange={(event) => setHandleInput(event.target.value)}
            placeholder="your-handle"
            aria-label="Your subdomain handle"
            className="h-auto border-0 font-mono focus-visible:outline-none"
            maxLength={32}
          />
          <InputGroupAddon>.is-pinoy.dev</InputGroupAddon>
        </InputGroup>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-6">
          <Segmented
            label="Theme"
            options={THEME_OPTIONS}
            value={theme}
            onChange={setTheme}
          />
          <Segmented
            label="Icon"
            options={ICON_OPTIONS}
            value={icon}
            onChange={setIcon}
          />
          <Segmented
            label="Format"
            options={FORMAT_OPTIONS}
            value={format}
            onChange={setFormat}
          />
        </div>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        {ITEMS.map((item) => {
          const previewSrc = WORKER + item.buildPath(handle, theme, true) + iconParam
          const copyUrl = WORKER + item.buildPath(handle, theme, false) + iconParam
          const link = item.buildLink(handle)

          return (
            <div key={item.id} className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>

              <div className="flex min-h-[80px] items-center justify-center overflow-x-auto border border-border bg-muted px-4 py-5">
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG served by the badges.is-pinoy.dev worker */}
                <img
                  src={previewSrc}
                  alt={item.alt}
                  className="max-w-full"
                  loading="lazy"
                />
              </div>

              <CodeBlock value={snippet(format, copyUrl, item.alt, link)} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
