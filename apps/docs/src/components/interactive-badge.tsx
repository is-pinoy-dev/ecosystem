'use client'

import { useEffect, useState } from 'react'
import { DynamicCode } from './dynamic-code'
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
        icon?: string
        animate?: string
      }
    }
  }
}

type BadgeType = 'deployed-on' | 'member' | 'pinoy-made' | 'certified'
type ThemeName = 'dark' | 'gold' | 'light' | 'outlined'
type AnimateMode = 'none' | 'spin' | 'hover'

const TYPES: BadgeType[] = ['deployed-on', 'member', 'pinoy-made', 'certified']
const THEMES: ThemeName[] = ['light', 'dark', 'gold', 'outlined']
const ANIMATIONS: AnimateMode[] = ['none', 'spin', 'hover']

const DEFAULT_THEME: Record<BadgeType, ThemeName> = {
  'deployed-on': 'light',
  member: 'light',
  'pinoy-made': 'light',
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
      <span className="w-16 shrink-0 font-mono text-[11px] text-fd-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const active = option === value
          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={`cursor-pointer border px-2 py-[3px] font-mono text-[11px] transition-colors ${
                active
                  ? 'border-[#F5C800] bg-[#F5C800]/10 font-semibold text-fd-foreground'
                  : 'border-fd-border text-fd-muted-foreground hover:text-fd-foreground'
              }`}
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
  const [theme, setTheme] = useState<ThemeName>('light')
  const [animate, setAnimate] = useState<AnimateMode>('none')
  const [icon, setIcon] = useState(true)

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
    animate !== 'none' ? `animate="${animate}"` : null,
    !icon ? 'icon="false"' : null,
  ].filter(Boolean)
  const snippet = `<script src="https://badges.is-pinoy.dev/badge.js"></script>\n\n<is-pinoy-badge ${attrs.join(' ')}></is-pinoy-badge>`

  return (
    <div className="my-4 space-y-3">
      <div className="space-y-2">
        <Segmented label="type" value={type} options={TYPES} onChange={onType} />
        <Segmented label="theme" value={theme} options={THEMES} onChange={setTheme} />
        <Segmented label="animate" value={animate} options={ANIMATIONS} onChange={setAnimate} />
        <Segmented
          label="icon"
          value={icon ? 'on' : 'off'}
          options={['on', 'off'] as const}
          onChange={(v) => setIcon(v === 'on')}
        />
      </div>

      <div className="flex items-center justify-center border border-fd-border bg-fd-muted p-8">
        <is-pinoy-badge
          key={`${type}-${theme}-${animate}-${icon}-${name}`}
          {...(needsHandle ? { handle: name } : {})}
          type={type}
          theme={theme}
          {...(animate !== 'none' ? { animate } : {})}
          {...(icon ? {} : { icon: 'false' })}
        />
      </div>
      <p className="m-0 font-mono text-[11px] text-fd-muted-foreground">
        Motion moves only the sun mark and switches off under reduced-motion. On{' '}
        <code>animate=&quot;hover&quot;</code>, hover the badge to see the turn.
      </p>

      <DynamicCode lang="html" code={snippet} />
    </div>
  )
}
