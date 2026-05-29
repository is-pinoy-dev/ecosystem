import type { Hono } from 'hono'
import type { BadgeVariant, OutputFormat } from '../lib/svg.ts'
import { generateBadgeSvg } from '../lib/svg.ts'
import { isSubdomainRegistered } from '../lib/registry.ts'
import { svgToPng, svgToWebp } from '../lib/render.ts'
import { badgeCacheHeaders } from '../lib/cache.ts'
import type { Env } from '../index.ts'

const VALID_VARIANTS = new Set<BadgeVariant>(['default', 'outline', 'flat', 'pixel'])
const VALID_FORMATS = new Set<OutputFormat>(['svg', 'png', 'webp'])

function parseVariant(raw: string | undefined): BadgeVariant {
  return VALID_VARIANTS.has(raw as BadgeVariant) ? (raw as BadgeVariant) : 'default'
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
  app.get('/:subdomain/badge', async (c) => {
    const subdomain = c.req.param('subdomain')
    const variant = parseVariant(c.req.query('variant'))
    const format = parseFormat(c.req.query('format'))

    const registered = await isSubdomainRegistered(subdomain, c.env)
    const svg = generateBadgeSvg({ subdomain, variant, notFound: !registered })

    return respond(svg, format)
  })
}
