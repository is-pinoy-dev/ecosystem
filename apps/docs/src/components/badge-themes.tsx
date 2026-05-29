'use client'

import { useState } from 'react'
import { BADGE_HOST } from '@/lib/badge-host'
import { useSubdomainStore } from '@/store/subdomain'

interface BadgeThemesProps {
  basePath: string
  themes: string[]
  alt?: string
}

export function BadgeThemes({ basePath, themes, alt = 'Badge preview' }: BadgeThemesProps) {
  const { name } = useSubdomainStore()
  const [selected, setSelected] = useState(themes[0]!)

  const toSrc = (theme: string) => {
    const path = basePath.replaceAll('yourname', name)
    const separator = path.includes('?') ? '&' : '?'
    return `${BADGE_HOST}${path}${separator}theme=${theme}&preview=true`
  }

  const embedUrl = (theme: string) =>
    `${basePath.replaceAll('yourname', name)}${basePath.includes('?') ? '&' : '?'}theme=${theme}`

  const linkUrl = basePath.includes('yourname')
    ? `https://${name}.is-pinoy.dev`
    : 'https://is-pinoy.dev'

  return (
    <div className="my-4 space-y-3">
      <div className="flex flex-wrap gap-4">
        {themes.map((theme) => {
          const active = selected === theme
          return (
            <button
              key={theme}
              onClick={() => setSelected(theme)}
              className="flex flex-col items-start gap-1.5 cursor-pointer"
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                opacity: active ? 1 : 0.45,
                transition: 'opacity 0.15s',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={toSrc(theme)}
                alt={`${alt} — ${theme}`}
                style={{ imageRendering: 'pixelated' }}
              />
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: active ? '#fff' : '#666',
                  fontWeight: active ? 'bold' : 'normal',
                }}
              >
                {active ? '▶ ' : ''}{theme}
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
  const [tab, setTab] = useState<'md' | 'html'>('md')
  const fullUrl = `https://badges.is-pinoy.dev${embedUrl}`

  const md = `[![Badge](${fullUrl})](${linkUrl})`
  const html = `<a href="${linkUrl}"><img src="${fullUrl}" alt="Badge" /></a>`

  return (
    <div className="rounded border border-border overflow-hidden text-sm">
      <div className="flex border-b border-border">
        {(['md', 'html'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 text-xs font-mono"
            style={{
              background: tab === t ? 'var(--color-fd-muted)' : 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid #F5C800' : '2px solid transparent',
              color: tab === t ? '#F5C800' : '#888',
              cursor: 'pointer',
            }}
          >
            {t === 'md' ? 'Markdown' : 'HTML'}
          </button>
        ))}
      </div>
      <pre
        className="p-3 m-0 overflow-x-auto text-xs"
        style={{ background: 'var(--color-fd-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
      >
        <code>{tab === 'md' ? md : html}</code>
      </pre>
    </div>
  )
}
