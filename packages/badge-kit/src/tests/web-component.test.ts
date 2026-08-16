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
    for (const attr of [
      'handle',
      'type',
      'theme',
      'label',
      'shimmer',
      'shimmer-color',
      'tilt',
    ]) {
      expect(WEB_COMPONENT_JS).toContain(attr)
    }
  })

  it('keeps the quiet border hover and v2 typography', () => {
    expect(WEB_COMPONENT_JS).toContain('.ipd-card:hover')
    expect(WEB_COMPONENT_JS).not.toContain('Press Start 2P')
  })

  it('tilts the card toward the cursor', () => {
    expect(WEB_COMPONENT_JS).toContain('rotateX(var(--rx')
    expect(WEB_COMPONENT_JS).toContain('rotateY(var(--ry')
    expect(WEB_COMPONENT_JS).toContain('perspective(')
    expect(WEB_COMPONENT_JS).toContain("addEventListener('pointermove'")
    // leaving the card must reset the rotation, or it sticks at the last angle
    expect(WEB_COMPONENT_JS).toContain("addEventListener('pointerleave'")
    // tilt="false" opts out
    expect(WEB_COMPONENT_JS).toContain('.ipd-card.no-tilt{transform:none;}')
  })

  it('sweeps a configurable shimmer across the card', () => {
    expect(WEB_COMPONENT_JS).toContain('@keyframes ipd-shimmer')
    for (const mode of ['sh-off', 'sh-sweep', 'sh-loop', 'sh-always']) {
      expect(WEB_COMPONENT_JS).toContain(mode)
    }
    // the sweep is clipped to the card instead of bleeding onto the page
    expect(WEB_COMPONENT_JS).toContain('overflow:hidden')
  })

  it('validates shimmer-color instead of inlining it raw', () => {
    // shimmer-color lands inside a <style> block, so an unvalidated value could
    // close the rule and inject arbitrary CSS. Only color syntax is accepted.
    expect(WEB_COMPONENT_JS).toContain('parseCssColor')
    expect(WEB_COMPONENT_JS).toContain('rgba(255,255,255,0.55)')
  })

  it('offers opt-in sun motion that only moves the mark', () => {
    expect(WEB_COMPONENT_JS).toContain('@keyframes ipd-spin')
    expect(WEB_COMPONENT_JS).toContain('.ipd-card.a-spin .ipd-glyph')
    expect(WEB_COMPONENT_JS).toContain('.ipd-card.a-hover:hover .ipd-glyph')
    // motion targets the glyph, never the text
    expect(WEB_COMPONENT_JS).not.toContain('.ipd-value{animation')
  })

  it('honors prefers-reduced-motion for sun, shimmer, and tilt', () => {
    expect(WEB_COMPONENT_JS).toContain('prefers-reduced-motion')
    expect(WEB_COMPONENT_JS).toContain('.ipd-glyph{animation:none!important')
    expect(WEB_COMPONENT_JS).toContain('.ipd-shimmer{display:none!important;}')
    expect(WEB_COMPONENT_JS).toContain('.ipd-glare{display:none!important;}')
    // the tilt listener is also skipped, not just visually suppressed
    expect(WEB_COMPONENT_JS).toContain('prefersReducedMotion()')
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
