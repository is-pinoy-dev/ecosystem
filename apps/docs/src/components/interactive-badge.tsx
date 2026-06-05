'use client'

import { useEffect, useState } from 'react'
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import { BADGE_HOST } from '@/lib/badge-host'
import { useSubdomainStore } from '@/store/subdomain'

// The <is-pinoy-badge> web component is defined by the script served at
// `${BADGE_HOST}/badge.js`. Teach TSX about the custom element + its attributes.
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX augmentation requires a namespace
  namespace JSX {
    interface IntrinsicElements {
      'is-pinoy-badge': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        handle?: string
        type?: string
        theme?: string
        label?: string
        shimmer?: string
        'shimmer-color'?: string
        tilt?: string
      }
    }
  }
}

type BadgeType = 'deployed-on' | 'member' | 'pinoy-made' | 'certified'
type ThemeName = 'dark' | 'gold' | 'light' | 'outlined'
type ShimmerMode = 'off' | 'sweep' | 'loop' | 'always'

const TYPES: BadgeType[] = ['deployed-on', 'member', 'pinoy-made', 'certified']
const THEMES: ThemeName[] = ['dark', 'gold', 'light', 'outlined']
const SHIMMERS: ShimmerMode[] = ['off', 'sweep', 'loop', 'always']

const DEFAULT_THEME: Record<BadgeType, ThemeName> = {
  'deployed-on': 'dark',
  member: 'dark',
  'pinoy-made': 'dark',
  certified: 'gold',
}

/** Inject the CDN web-component script once; the element upgrades when it loads. */
function useBadgeScript() {
  useEffect(() => {
    const src = `${BADGE_HOST}/badge.js`
    if (document.querySelector('script[data-ipd-badge]')) return
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.setAttribute('data-ipd-badge', '')
    document.head.appendChild(script)
  }, [])
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="shrink-0"
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#888',
          width: '64px',
        }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = option === value
          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className="cursor-pointer"
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                padding: '3px 8px',
                border: `1px solid ${active ? '#F5C800' : '#333'}`,
                background: active ? 'rgba(245,200,0,0.08)' : 'transparent',
                color: active ? '#F5C800' : '#888',
                transition: 'all 0.1s',
              }}
            >
              {option}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function InteractiveBadge() {
  useBadgeScript()
  const { name } = useSubdomainStore()

  const [type, setType] = useState<BadgeType>('deployed-on')
  const [theme, setTheme] = useState<ThemeName>('dark')
  const [shimmer, setShimmer] = useState<ShimmerMode>('sweep')
  const [tilt, setTilt] = useState(true)

  // Switching type resets to that type's default theme so the preview stays valid.
  const onType = (next: BadgeType) => {
    setType(next)
    setTheme(DEFAULT_THEME[next])
  }

  const needsHandle = type !== 'pinoy-made'

  // Build the embed snippet, omitting attributes left at their defaults.
  const attrs = [
    needsHandle ? `handle="${name}"` : null,
    `type="${type}"`,
    `theme="${theme}"`,
    shimmer !== 'sweep' ? `shimmer="${shimmer}"` : null,
    !tilt ? 'tilt="false"' : null,
  ].filter(Boolean)
  const snippet = `<script src="https://badges.is-pinoy.dev/badge.js"></script>\n\n<is-pinoy-badge ${attrs.join(' ')}></is-pinoy-badge>`

  return (
    <div className="my-4 space-y-3">
      <div className="space-y-2">
        <Segmented label="type" value={type} options={TYPES} onChange={onType} />
        <Segmented label="theme" value={theme} options={THEMES} onChange={setTheme} />
        <Segmented label="shimmer" value={shimmer} options={SHIMMERS} onChange={setShimmer} />
        <Segmented
          label="tilt"
          value={tilt ? 'on' : 'off'}
          options={['on', 'off'] as const}
          onChange={(v) => setTilt(v === 'on')}
        />
      </div>

      <div
        className="flex items-center justify-center"
        style={{
          minHeight: '120px',
          padding: '32px',
          background:
            'repeating-linear-gradient(45deg, #141414, #141414 10px, #181818 10px, #181818 20px)',
          border: '1px solid #2a2a2a',
        }}
      >
        <is-pinoy-badge
          key={`${type}-${theme}-${shimmer}-${tilt}-${name}`}
          {...(needsHandle ? { handle: name } : {})}
          type={type}
          theme={theme}
          shimmer={shimmer}
          {...(tilt ? {} : { tilt: 'false' })}
        />
      </div>
      <p style={{ fontFamily: 'monospace', fontSize: '11px', color: '#666', margin: 0 }}>
        Hover the badge to see the shimmer; move your cursor across it for the tilt.
      </p>

      <CodeBlock>
        <Pre className="px-4">{snippet}</Pre>
      </CodeBlock>
    </div>
  )
}
