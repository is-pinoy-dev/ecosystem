import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { ShowcaseCardImage } from "./showcase-card-image"

describe("ShowcaseCardImage", () => {
  it("shows the captured screenshot when there is one", () => {
    const html = renderToStaticMarkup(
      <ShowcaseCardImage
        screenshotUrl="https://cdn.example/showcase/juan/preview-v1.jpeg"
        screenshotStatus="ready"
        subdomain="juan"
      />
    )

    expect(html).toContain("https://cdn.example/showcase/juan/preview-v1.jpeg")
    expect(html).toContain("object-top")
  })

  it("falls back to the preview endpoint when no screenshot exists yet", () => {
    const html = renderToStaticMarkup(
      <ShowcaseCardImage
        screenshotUrl={null}
        screenshotStatus="pending"
        subdomain="juan"
      />
    )

    expect(html).toContain("/_tools/og/preview?subdomain=juan")
    expect(html).not.toContain("animate-pulse")
  })

  it("falls back for a subdomain the manifest knows nothing about", () => {
    const html = renderToStaticMarkup(
      <ShowcaseCardImage
        screenshotUrl={null}
        screenshotStatus="unknown"
        subdomain="juan"
      />
    )

    expect(html).toContain("/_tools/og/preview?subdomain=juan")
    expect(html).not.toContain("animate-pulse")
  })

  it("never animates a card that has no capture in flight", () => {
    for (const status of ["pending", "failed", "unknown", "ready"] as const) {
      const html = renderToStaticMarkup(
        <ShowcaseCardImage
          screenshotUrl={null}
          screenshotStatus={status}
          subdomain="juan"
        />
      )

      expect(html).not.toContain("animate-pulse")
    }
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
