import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { registerEmbedRoute } from '../routes/embed.ts'
import type { Env } from '../index.ts'

function makeApp() {
  const app = new Hono<{ Bindings: Env }>()
  registerEmbedRoute(app)
  return app
}

describe('GET /badge.js', () => {
  it('serves the web component as JavaScript', async () => {
    const res = await makeApp().request('/badge.js')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/javascript')
  })

  it('is cached at the edge for one day', async () => {
    const res = await makeApp().request('/badge.js')
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400')
  })

  it('returns the custom element definition', async () => {
    const res = await makeApp().request('/badge.js')
    const body = await res.text()
    expect(body).toContain("customElements.define('is-pinoy-badge'")
  })
})
