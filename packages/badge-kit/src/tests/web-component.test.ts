import { describe, it, expect } from 'vitest'
import { WEB_COMPONENT_JS, WEB_COMPONENT_VERSION } from '../lib/web-component.ts'

describe('web component source', () => {
  it('defines the is-pinoy-badge custom element', () => {
    expect(WEB_COMPONENT_JS).toContain("customElements.define('is-pinoy-badge'")
  })

  it('guards against double registration', () => {
    expect(WEB_COMPONENT_JS).toContain("customElements.get('is-pinoy-badge')")
  })

  it('renders into a shadow root for isolation', () => {
    expect(WEB_COMPONENT_JS).toContain('attachShadow')
  })

  it('observes the configurable attributes', () => {
    for (const attr of ['handle', 'type', 'theme', 'label']) {
      expect(WEB_COMPONENT_JS).toContain(attr)
    }
  })

  it('uses a quiet hover, not arcade motion', () => {
    // v2.0 retires the tilt/glare/shimmer; hover is a plain border/opacity shift.
    expect(WEB_COMPONENT_JS).toContain('.ipd-card:hover')
    expect(WEB_COMPONENT_JS).not.toContain('rotateX')
    expect(WEB_COMPONENT_JS).not.toContain('ipd-shimmer')
    expect(WEB_COMPONENT_JS).not.toContain('Press Start 2P')
  })

  it('offers opt-in sun motion that only moves the mark', () => {
    expect(WEB_COMPONENT_JS).toContain('@keyframes ipd-spin')
    expect(WEB_COMPONENT_JS).toContain('.ipd-card.a-spin .ipd-glyph')
    expect(WEB_COMPONENT_JS).toContain('.ipd-card.a-hover:hover .ipd-glyph')
    // motion targets the glyph, never the text
    expect(WEB_COMPONENT_JS).not.toContain('.ipd-value{animation')
  })

  it('honors prefers-reduced-motion, including the sun animation', () => {
    expect(WEB_COMPONENT_JS).toContain('prefers-reduced-motion')
    expect(WEB_COMPONENT_JS).toContain('.ipd-glyph{animation:none!important')
  })

  it('sanitizes the handle to [a-z0-9-]', () => {
    expect(WEB_COMPONENT_JS).toContain('/[^a-z0-9-]/g')
  })

  it('escapes interpolated text to prevent markup injection', () => {
    expect(WEB_COMPONENT_JS).toContain('&lt;')
    expect(WEB_COMPONENT_JS).toContain('&amp;')
  })

  it('links pinoy-made to the root and others to the subdomain', () => {
    expect(WEB_COMPONENT_JS).toContain("'https://is-pinoy.dev'")
    expect(WEB_COMPONENT_JS).toContain("'https://' + handle + '.is-pinoy.dev'")
  })

  it('exposes a version string', () => {
    expect(WEB_COMPONENT_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
