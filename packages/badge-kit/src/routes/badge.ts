import type { Hono } from 'hono'
import type { Theme, OutputFormat } from '../lib/svg.ts'
import {
  generateBadgeSvg,
  DEFAULT_BADGE_THEME,
  VALID_BADGE_THEMES,
  DEFAULT_SUBDOMAIN_LABEL,
  LABEL_MAX_LENGTH,
} from '../lib/svg.ts'
import { isSubdomainRegistered } from '../lib/registry.ts'
import { parseOverrides } from '../lib/color.ts'
import { svgToPng, svgToWebp } from '../lib/render.ts'
import { badgeCacheHeaders } from '../lib/cache.ts'
import type { Env } from '../index.ts'

const SUBDOMAIN_TYPES = new Set(['subdomain', 'member'])
const PLATFORM_TYPES = new Set(['pinoy-made', 'certified'])
const VALID_FORMATS = new Set<OutputFormat>(['svg', 'png', 'webp'])

function parseTheme(raw: string | undefined, type: string): Theme {
  const valid = VALID_BADGE_THEMES[type as keyof typeof VALID_BADGE_THEMES] as Theme[] | undefined
  if (!valid) return 'dark'
  return valid.includes(raw as Theme) ? (raw as Theme) : DEFAULT_BADGE_THEME[type as keyof typeof DEFAULT_BADGE_THEME]
}

function parseFormat(raw: string | undefined): OutputFormat {
  return VALID_FORMATS.has(raw as OutputFormat) ? (raw as OutputFormat) : 'svg'
}

function parseLabel(raw: string | undefined): string {
  const label = (raw ?? DEFAULT_SUBDOMAIN_LABEL).toUpperCase().trim()
  return label.slice(0, LABEL_MAX_LENGTH)
}

async function respond(svg: string, format: OutputFormat): Promise<Response> {
  const headers = badgeCacheHeaders()

  if (format === 'png') {
    const png = await svgToPng(svg)
    return new Response(png, { headers: { ...headers, 'Content-Type': 'image/png' } })
  }

  if (format === 'webp') {
    const webp = await svgToWebp(svg)
    return new Response(webp, { headers: { ...headers, 'Content-Type': 'image/webp' } })
  }

  return new Response(svg, { headers: { ...headers, 'Content-Type': 'image/svg+xml' } })
}

export function registerBadgeRoute(app: Hono<{ Bindings: Env }>): void {
  // GET /badge/:subdomain?type=subdomain|member&label=...&theme=...&format=...
  app.get('/badge/:subdomain', async (c) => {
    const subdomain = c.req.param('subdomain')
    const rawType = c.req.query('type')
    const type = SUBDOMAIN_TYPES.has(rawType as string) ? (rawType as 'subdomain' | 'member') : 'subdomain'
    const theme = parseTheme(c.req.query('theme'), type)
    const format = parseFormat(c.req.query('format'))
    const label = parseLabel(c.req.query('label'))

    const overrides = parseOverrides((k) => c.req.query(k))

    const preview = c.req.query('preview') === 'true'
    const registered = preview || await isSubdomainRegistered(subdomain)
    const svg = generateBadgeSvg({ subdomain, type, theme, notFound: !registered, label, overrides })

    return respond(svg, format)
  })

  // GET /badge?type=pinoy-made|certified&theme=...&format=...
  app.get('/badge', async (c) => {
    const rawType = c.req.query('type')
    const type = PLATFORM_TYPES.has(rawType as string) ? (rawType as 'pinoy-made' | 'certified') : 'pinoy-made'
    const theme = parseTheme(c.req.query('theme'), type)
    const format = parseFormat(c.req.query('format'))
    const overrides = parseOverrides((k) => c.req.query(k))

    const svg = generateBadgeSvg({ subdomain: '', type, theme, notFound: false, overrides })
    return respond(svg, format)
  })
}
