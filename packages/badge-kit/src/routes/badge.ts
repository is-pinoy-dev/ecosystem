import type { Hono } from 'hono'
import type { BadgeType, Theme, OutputFormat } from '../lib/svg.ts'
import { generateBadgeSvg, DEFAULT_BADGE_THEME, VALID_BADGE_THEMES } from '../lib/svg.ts'
import { isSubdomainRegistered } from '../lib/registry.ts'
import { svgToPng, svgToWebp } from '../lib/render.ts'
import { badgeCacheHeaders } from '../lib/cache.ts'
import type { Env } from '../index.ts'

const VALID_TYPES = new Set<BadgeType>([
  'deployed-on',
  'built-by',
  'proud-pinoy-dev',
  'certified',
  'member',
  'pinoy-made',
])
const VALID_FORMATS = new Set<OutputFormat>(['svg', 'png', 'webp'])

function parseBadgeType(raw: string | undefined): BadgeType {
  return VALID_TYPES.has(raw as BadgeType) ? (raw as BadgeType) : 'deployed-on'
}

function parseTheme(raw: string | undefined, type: BadgeType): Theme {
  const valid = VALID_BADGE_THEMES[type] as Theme[]
  return valid.includes(raw as Theme) ? (raw as Theme) : DEFAULT_BADGE_THEME[type]
}

function parseFormat(raw: string | undefined): OutputFormat {
  return VALID_FORMATS.has(raw as OutputFormat) ? (raw as OutputFormat) : 'svg'
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
  // GET /badge/:subdomain?type=...&theme=...&format=...
  app.get('/badge/:subdomain', async (c) => {
    const subdomain = c.req.param('subdomain')
    const type = parseBadgeType(c.req.query('type'))
    const theme = parseTheme(c.req.query('theme'), type)
    const format = parseFormat(c.req.query('format'))

    const registered = await isSubdomainRegistered(subdomain, c.env)
    const svg = generateBadgeSvg({ subdomain, type, theme, notFound: !registered })

    return respond(svg, format)
  })

  // GET /badge?type=pinoy-made&theme=...&format=...
  app.get('/badge', async (c) => {
    const type = parseBadgeType(c.req.query('type'))
    const theme = parseTheme(c.req.query('theme'), type)
    const format = parseFormat(c.req.query('format'))

    const svg = generateBadgeSvg({ subdomain: '', type, theme, notFound: false })
    return respond(svg, format)
  })
}
