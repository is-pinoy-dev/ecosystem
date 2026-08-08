import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ShowcaseCardImage } from "./showcase-card-image"

describe("ShowcaseCardImage", () => {
  it("renders the branded fallback without a broken image", () => {
    const html = renderToStaticMarkup(
      <ShowcaseCardImage
        screenshotUrl={null}
        screenshotStatus="failed"
        subdomain="juan"
      />
    )

    expect(html).toContain("Preview unavailable")
    expect(html).toContain("juan.is-pinoy.dev")
    expect(html).toContain('src="/logo.png"')
    expect(html).not.toContain("https://juan.is-pinoy.dev/favicon")
  })

  it("keeps the old screenshot visible while a replacement processes", () => {
    const html = renderToStaticMarkup(
      <ShowcaseCardImage
        screenshotUrl="https://screenshots.example/showcase/juan/preview-v1.jpeg"
        screenshotStatus="processing"
        subdomain="juan"
      />
    )

    expect(html).toContain(
      "https://screenshots.example/showcase/juan/preview-v1.jpeg"
    )
    expect(html).toContain("Updating preview")
    expect(html).toContain("object-top")
  })
})
