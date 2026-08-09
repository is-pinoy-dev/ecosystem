import { describe, expect, it } from "vitest"

import { buildSvg, type OgData } from "../generate"

const BACKGROUND = "data:image/jpeg;base64,YmFja2dyb3VuZA=="
const SCREENSHOT = "data:image/jpeg;base64,c2NyZWVuc2hvdA=="
const AVATAR = "data:image/png;base64,YXZhdGFy"

const registered: OgData = {
  subdomain: "juan",
  owner: "juandelacruz",
  found: true,
}

describe("buildSvg", () => {
  it("renders the capture when the portfolio has one", () => {
    const svg = buildSvg(registered, BACKGROUND, AVATAR, SCREENSHOT)

    expect(svg).toContain(SCREENSHOT)
    // The branded artwork is what the capture replaces, not something it sits on.
    expect(svg).not.toContain(BACKGROUND)
  })

  it("crops the capture from the top so a site's hero survives the frame", () => {
    const svg = buildSvg(registered, BACKGROUND, AVATAR, SCREENSHOT)

    expect(svg).toContain('preserveAspectRatio="xMidYMin slice"')
  })

  it("keeps the caption clear of the capture", () => {
    // Legibility must not depend on what the captured site looks like, so the
    // wordmark and owner sit below where the screenshot stops.
    const svg = buildSvg(registered, BACKGROUND, AVATAR, SCREENSHOT)
    const screenshot = svg.match(/<image[^>]+height="(\d+)"/)
    const bottom = Number(screenshot?.[1])

    expect(bottom).toBeGreaterThan(0)
    for (const [, y] of svg.matchAll(/<text[^>]+\sy="(\d+)"/g)) {
      expect(Number(y)).toBeGreaterThan(bottom)
    }
  })

  it("still names the subdomain and its owner", () => {
    const svg = buildSvg(registered, BACKGROUND, AVATAR, SCREENSHOT)

    expect(svg).toContain(">juan<")
    expect(svg).toContain(">@juandelacruz<")
  })

  it("falls back to the branded card until a capture exists", () => {
    const svg = buildSvg(registered, BACKGROUND, AVATAR)

    expect(svg).toContain(BACKGROUND)
    expect(svg).toContain(">juan<")
  })

  it("shows the owner's initial when the avatar could not be fetched", () => {
    const svg = buildSvg(registered, BACKGROUND, undefined, SCREENSHOT)

    expect(svg).not.toContain(AVATAR)
    expect(svg).toContain(">J<")
  })

  it("shrinks the wordmark so a long subdomain stays inside the card", () => {
    const short = buildSvg(registered, BACKGROUND, AVATAR, SCREENSHOT)
    const long = buildSvg(
      { ...registered, subdomain: "a-very-long-portfolio-subdomain" },
      BACKGROUND,
      AVATAR,
      SCREENSHOT
    )

    const sizeOf = (svg: string) =>
      Number(
        svg.match(
          /font-size="(\d+)"\s+font-weight="600"\s+letter-spacing="-2"/
        )?.[1]
      )

    expect(sizeOf(long)).toBeLessThan(sizeOf(short))
  })

  it("ignores a capture for a subdomain that is not registered", () => {
    // Nothing is captured for an unregistered name; the 404 card is the answer.
    const svg = buildSvg(
      { subdomain: "nobody", owner: "", found: false },
      BACKGROUND,
      AVATAR,
      SCREENSHOT
    )

    expect(svg).not.toContain(SCREENSHOT)
    expect(svg).toContain("404 — NOT FOUND")
  })

  it("escapes a subdomain rather than letting it close a tag", () => {
    const svg = buildSvg(
      { ...registered, subdomain: 'a"><script>' },
      BACKGROUND,
      AVATAR,
      SCREENSHOT
    )

    expect(svg).not.toContain("<script>")
    expect(svg).toContain("&lt;script&gt;")
  })
})
