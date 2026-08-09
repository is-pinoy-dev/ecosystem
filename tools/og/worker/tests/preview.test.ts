import { describe, expect, it } from "vitest"

import {
  extractOgImageUrl,
  readLimitedText,
  resolvePortfolioOgImage,
  resolveRequestedSubdomain,
} from "../preview"

const BASE = "https://juan.is-pinoy.dev"

describe("resolveRequestedSubdomain", () => {
  const params = (query: string) => new URLSearchParams(query)

  it("takes the label from the host it was served on", () => {
    expect(resolveRequestedSubdomain("juan.is-pinoy.dev", params(""))).toBe(
      "juan"
    )
  })

  it("accepts an explicit subdomain on the apex", () => {
    // Portfolios pointed at an external host never reach this Worker on their
    // own hostname, so the showcase asks the apex on their behalf.
    expect(
      resolveRequestedSubdomain("is-pinoy.dev", params("subdomain=juan"))
    ).toBe("juan")
  })

  it("prefers the host label over a conflicting query parameter", () => {
    expect(
      resolveRequestedSubdomain("juan.is-pinoy.dev", params("subdomain=maria"))
    ).toBe("juan")
  })

  it("rejects a parameter that is not a registrable label", () => {
    expect(
      resolveRequestedSubdomain("is-pinoy.dev", params("subdomain=../evil"))
    ).toBeNull()
    expect(
      resolveRequestedSubdomain(
        "is-pinoy.dev",
        params("subdomain=juan.is-pinoy.dev")
      )
    ).toBeNull()
  })

  it("returns null on the apex with no parameter", () => {
    expect(resolveRequestedSubdomain("is-pinoy.dev", params(""))).toBeNull()
  })
})

describe("extractOgImageUrl", () => {
  it("reads a property-first meta tag", () => {
    const html = `<meta property="og:image" content="https://cdn.example/cover.png">`
    expect(extractOgImageUrl(html, BASE)).toBe("https://cdn.example/cover.png")
  })

  it("reads a content-first meta tag", () => {
    const html = `<meta content="https://cdn.example/cover.png" property="og:image">`
    expect(extractOgImageUrl(html, BASE)).toBe("https://cdn.example/cover.png")
  })

  it("resolves a relative image against the portfolio origin", () => {
    const html = `<meta property="og:image" content="/assets/cover.png">`
    expect(extractOgImageUrl(html, BASE)).toBe(`${BASE}/assets/cover.png`)
  })

  it("refuses a scheme the browser must never load as an image", () => {
    const html = `<meta property="og:image" content="javascript:alert(1)">`
    expect(extractOgImageUrl(html, BASE)).toBeNull()
  })

  it("returns null when the page declares no og:image", () => {
    const html = `<html><head><title>juan</title></head><body></body></html>`
    expect(extractOgImageUrl(html, BASE)).toBeNull()
  })
})

describe("readLimitedText", () => {
  it("returns a short body whole", async () => {
    const text = await readLimitedText(new Response("<html>juan</html>"), 1024)
    expect(text).toBe("<html>juan</html>")
  })

  it("stops reading once the cap is reached", async () => {
    // og:image lives in <head>; a multi-megabyte page must not be drained.
    const body = "x".repeat(10_000)
    const text = await readLimitedText(new Response(body), 512)
    expect(text.length).toBeLessThanOrEqual(512)
  })
})

describe("resolvePortfolioOgImage", () => {
  it("returns the og:image the portfolio declares", async () => {
    const fetchImpl = async () =>
      new Response(`<meta property="og:image" content="/cover.png">`)

    await expect(resolvePortfolioOgImage("juan", fetchImpl)).resolves.toBe(
      "https://juan.is-pinoy.dev/cover.png"
    )
  })

  it("returns null when the portfolio does not answer", async () => {
    const fetchImpl = async () => new Response("nope", { status: 503 })

    await expect(resolvePortfolioOgImage("juan", fetchImpl)).resolves.toBeNull()
  })

  it("returns null when the request throws", async () => {
    const fetchImpl = async () => {
      throw new Error("timed out")
    }

    await expect(resolvePortfolioOgImage("juan", fetchImpl)).resolves.toBeNull()
  })
})
