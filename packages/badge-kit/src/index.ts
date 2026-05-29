import { Hono } from 'hono'
import { registerPresetRoutes } from './routes/presets.ts'
import { registerBadgeRoute } from './routes/badge.ts'

export interface Env {
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ZONE_ID: string
}

const app = new Hono<{ Bindings: Env }>()

registerPresetRoutes(app)
registerBadgeRoute(app)

app.get('/', (c) =>
  c.text('badges.is-pinoy.dev — embed a badge: /{subdomain}/badge?variant=pixel')
)

export default app
