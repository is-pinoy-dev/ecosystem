import { Hono } from 'hono'
import { registerBannerRoute } from './routes/banner.ts'
import { registerBadgeRoute } from './routes/badge.ts'

export interface Env {
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ZONE_ID: string
}

const app = new Hono<{ Bindings: Env }>()

registerBadgeRoute(app)
registerBannerRoute(app)

app.get('/', (c) =>
  c.text('badges.is-pinoy.dev — GET /badge/:subdomain?type=...&theme=...&format=...')
)

export default app
