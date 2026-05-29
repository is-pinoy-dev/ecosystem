import type { Hono } from 'hono'
import type { BadgeVariant, OutputFormat } from '../lib/svg.ts'
import { generatePresetSvg, generateBannerSvg } from '../lib/svg.ts'
import { svgToPng, svgToWebp } from '../lib/render.ts'
import { badgeCacheHeaders } from '../lib/cache.ts'
import type { Env } from '../index.ts'

const VALID_VARIANTS = new Set<BadgeVariant>(['default', 'outline', 'flat', 'pixel'])
const VALID_FORMATS = new Set<OutputFormat>(['svg', 'png', 'webp'])

function parseVariant(raw: string | undefined, defaultVal: BadgeVariant): BadgeVariant {
  return VALID_VARIANTS.has(raw as BadgeVariant) ? (raw as BadgeVariant) : defaultVal
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

export function registerPresetRoutes(app: Hono<{ Bindings: Env }>): void {
  app.get('/powered-by', async (c) => {
    const variant = parseVariant(c.req.query('variant'), 'pixel')
    const format = parseFormat(c.req.query('format'))
    const svg = generatePresetSvg('powered-by', variant)
    return respond(svg, format)
  })

  app.get('/filipino-dev', async (c) => {
    const variant = parseVariant(c.req.query('variant'), 'pixel')
    const format = parseFormat(c.req.query('format'))
    const svg = generatePresetSvg('filipino-dev', variant)
    return respond(svg, format)
  })

  app.get('/banner/:subdomain', async (c) => {
    const subdomain = c.req.param('subdomain')
    const format = parseFormat(c.req.query('format'))
    const svg = generateBannerSvg(subdomain)
    return respond(svg, format)
  })
}
