"use client"

import { useState } from "react"
import { Tabs, Tab } from "fumadocs-ui/components/tabs"
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock"
import { BADGE_HOST } from "@/lib/badge-host"
import { useSubdomainStore } from "@/store/subdomain"

interface BadgeThemesProps {
  basePath: string
  themes: string[]
  alt?: string
}

export function BadgeThemes({
  basePath,
  themes,
  alt = "Badge preview",
}: BadgeThemesProps) {
  const { name } = useSubdomainStore()
  const [selected, setSelected] = useState(themes[0]!)

  const toSrc = (theme: string) => {
    const path = basePath.replaceAll("yourname", name)
    const separator = path.includes("?") ? "&" : "?"
    return `${BADGE_HOST}${path}${separator}theme=${theme}&preview=true`
  }

  const embedUrl = (theme: string) =>
    `${basePath.replaceAll("yourname", name)}${basePath.includes("?") ? "&" : "?"}theme=${theme}`

  const linkUrl = basePath.includes("yourname")
    ? `https://${name}.is-pinoy.dev`
    : "https://is-pinoy.dev"

  return (
    <div className="my-4 space-y-3">
      <div className="flex flex-wrap gap-4">
        {themes.map((theme) => {
          const active = selected === theme
          return (
            <button
              key={theme}
              onClick={() => setSelected(theme)}
              className="flex cursor-pointer flex-col items-start gap-1.5 border-none bg-transparent p-0"
              style={{
                opacity: active ? 1 : 0.5,
                transition: "opacity 0.15s",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={toSrc(theme)} alt={`${alt} — ${theme}`} />
              <span
                className={`font-mono text-[11px] ${
                  active
                    ? "font-bold text-fd-foreground"
                    : "font-normal text-fd-muted-foreground"
                }`}
              >
                {active ? "▶ " : ""}
                {theme}
              </span>
            </button>
          )
        })}
      </div>

      <Embed embedUrl={embedUrl(selected)} linkUrl={linkUrl} />
    </div>
  )
}

function Embed({ embedUrl, linkUrl }: { embedUrl: string; linkUrl: string }) {
  const fullUrl = `https://badges.is-pinoy.dev${embedUrl}`

  const md = `[![Badge](${fullUrl})](${linkUrl})`
  const html = `<a href="${linkUrl}"><img src="${fullUrl}" alt="Badge" /></a>`

  return (
    <Tabs items={["Markdown", "HTML"]}>
      <Tab value="Markdown">
        <DynamicCodeBlock lang="markdown" code={md} />
      </Tab>
      <Tab value="HTML">
        <DynamicCodeBlock lang="html" code={html} />
      </Tab>
    </Tabs>
  )
}
