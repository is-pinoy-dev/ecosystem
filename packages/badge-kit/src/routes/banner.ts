import type { Hono } from 'hono'
import type { BannerType, Theme, OutputFormat } from '../lib/svg.ts'
import { generateBannerSvg, DEFAULT_BANNER_THEME, VALID_BANNER_THEMES } from '../lib/svg.ts'
import { parseOverrides } from '../lib/color.ts'
import { svgToPng, svgToWebp } from '../lib/render.ts'
import { badgeCacheHeaders } from '../lib/cache.ts'
import type { Env } from '../index.ts'

const VALID_FORMATS = new Set<OutputFormat>(['svg', 'png', 'webp'])

function parseTheme(raw: string | undefined, type: BannerType): Theme {
  const valid = VALID_BANNER_THEMES[type] as Theme[]
  return valid.includes(raw as Theme) ? (raw as Theme) : DEFAULT_BANNER_THEME[type]
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

export function registerBannerRoute(app: Hono<{ Bindings: Env }>): void {
  // GET /banner/:subdomain?type=readme|profile&theme=...&format=...
  app.get('/banner/:subdomain', async (c) => {
    const subdomain = c.req.param('subdomain')
    const rawType = c.req.query('type')
    const type: BannerType = rawType === 'profile' ? 'profile' : 'readme'
    const theme = parseTheme(c.req.query('theme'), type)
    const format = parseFormat(c.req.query('format'))
    const overrides = parseOverrides((k) => c.req.query(k))

    const svg = generateBannerSvg({ subdomain, type, theme, overrides })
    return respond(svg, format)
  })
}
