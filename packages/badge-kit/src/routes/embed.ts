import type { Hono } from 'hono'
import { WEB_COMPONENT_JS } from '../lib/web-component.ts'
import { badgeCacheHeaders } from '../lib/cache.ts'
import type { Env } from '../index.ts'

export function registerEmbedRoute(app: Hono<{ Bindings: Env }>): void {
  // GET /badge.js — the <is-pinoy-badge> web component for HTML pages.
  app.get('/badge.js', (c) =>
    new Response(WEB_COMPONENT_JS, {
      headers: {
        ...badgeCacheHeaders(),
        'Content-Type': 'application/javascript; charset=utf-8',
      },
    })
  )
}
