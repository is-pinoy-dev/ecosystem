// Renders the OG cards for real and measures what came out.
//
// The wordmark is sized from a character count, which is an estimate of how
// wide Geist will set a string. An estimate that is wrong overflows the card,
// and nothing in the SVG markup itself would show it — only rasterising does.

import { readFileSync } from "node:fs"
import { Resvg, initWasm } from "@resvg/resvg-wasm"
import { beforeAll, describe, expect, it } from "vitest"

import { buildSvg, type OgData } from "../generate"

const CARD_WIDTH = 1200
/** The margin the card's type is set inside, mirrored on both edges. */
const MARGIN = 70

const font = readFileSync("public/Geist-SemiBold.ttf")
const background = `data:image/jpeg;base64,${readFileSync(
  "public/subdomain-og-background.jpg"
).toString("base64")}`

beforeAll(async () => {
  await initWasm(readFileSync("node_modules/@resvg/resvg-wasm/index_bg.wasm"))
})

/** The ink extent of an SVG fragment, rendered with the card's real font. */
function measure(svg: string) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: CARD_WIDTH },
    font: { fontBuffers: [new Uint8Array(font)] },
  })
  const box = resvg.innerBBox()
  expect(box).toBeDefined()
  return box!
}

/**
 * The wordmark alone, pulled out of a full card so it can be measured without
 * the screenshot's own ink swamping the bounding box.
 */
function wordmarkOf(subdomain: string): string {
  const card = buildSvg(
    { subdomain, owner: "juandelacruz", found: true },
    background,
    undefined,
    // A 1x1 transparent GIF: enough to select the screenshot layout, small
    // enough to contribute no ink of its own.
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
  )
  const wordmark = card.match(
    /<text[\s\S]*?letter-spacing="-2"[\s\S]*?<\/text>/
  )
  expect(wordmark).not.toBeNull()
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="630">${wordmark![0]}</svg>`
}

describe("screenshot card wordmark", () => {
  // The registry allows labels from 3 to 63 characters; every one of them ends
  // up on a card, so every band of the size scale has to hold.
  const lengths = [3, 8, 20, 21, 26, 27, 32, 33, 42, 43, 55, 56, 63]

  it.each(lengths)(
    "fits a %i-character subdomain inside the card",
    (length) => {
      const box = measure(wordmarkOf("a".repeat(length)))

      expect(box.x).toBeGreaterThanOrEqual(MARGIN - 4)
      expect(box.x + box.width).toBeLessThanOrEqual(CARD_WIDTH - MARGIN + 4)
    }
  )

  it("keeps the wordmark clear of the screenshot above it", () => {
    // Sized at the top of the scale, where the type is tallest.
    const box = measure(wordmarkOf("abc"))

    expect(box.y).toBeGreaterThan(412)
  })

  it("keeps the wordmark clear of the owner row below it", () => {
    const box = measure(wordmarkOf("abc"))

    // The avatar's top edge — the wordmark must not descend into it.
    expect(box.y + box.height).toBeLessThan(550)
  })
})

describe("buildSvg output", () => {
  const registered: OgData = {
    subdomain: "juan",
    owner: "juandelacruz",
    found: true,
  }

  it("rasterises a card at the OG size resvg is asked for", () => {
    const resvg = new Resvg(buildSvg(registered, background), {
      fitTo: { mode: "width", value: CARD_WIDTH },
      font: { fontBuffers: [new Uint8Array(font)] },
    })
    const png = resvg.render()

    expect(png.width).toBe(1200)
    expect(png.height).toBe(630)
  })
})
