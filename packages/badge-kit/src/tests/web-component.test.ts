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

  it('has a quiet border hover as the default, not Press Start 2P', () => {
    expect(WEB_COMPONENT_JS).toContain('.ipd-card:hover')
    expect(WEB_COMPONENT_JS).not.toContain('Press Start 2P')
  })

  it('offers opt-in sun motion that only moves the mark', () => {
    expect(WEB_COMPONENT_JS).toContain('@keyframes ipd-spin')
    expect(WEB_COMPONENT_JS).toContain('.ipd-card.a-spin .ipd-glyph')
    expect(WEB_COMPONENT_JS).toContain('.ipd-card.a-hover:hover .ipd-glyph')
    // motion targets the glyph, never the text
    expect(WEB_COMPONENT_JS).not.toContain('.ipd-value{animation')
  })

  it('offers opt-in tilt + shimmer, gated behind attributes', () => {
    // effects exist…
    expect(WEB_COMPONENT_JS).toContain('rotateX(var(--rx')
    expect(WEB_COMPONENT_JS).toContain('@keyframes ipd-shimmer')
    expect(WEB_COMPONENT_JS).toContain('pointermove')
    // …but only when the class is present (default badge has neither)
    expect(WEB_COMPONENT_JS).toContain('.ipd-card.tilt{')
    expect(WEB_COMPONENT_JS).toContain("tiltOn ? ' tilt' : ''")
    expect(WEB_COMPONENT_JS).toContain("shimmer !== 'off'")
    for (const attr of ['shimmer', 'shimmer-color', 'tilt']) {
      expect(WEB_COMPONENT_JS).toContain(attr)
    }
  })

  it('validates the shimmer color so it cannot inject CSS', () => {
    expect(WEB_COMPONENT_JS).toContain('function shimmerColor')
  })

  it('honors prefers-reduced-motion for every effect', () => {
    expect(WEB_COMPONENT_JS).toContain('prefers-reduced-motion')
    expect(WEB_COMPONENT_JS).toContain('.ipd-glyph{animation:none!important')
    expect(WEB_COMPONENT_JS).toContain('.ipd-card.tilt{transform:none!important')
    expect(WEB_COMPONENT_JS).toContain('.ipd-shimmer,.ipd-glare{display:none!important')
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
