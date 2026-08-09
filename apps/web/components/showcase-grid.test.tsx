import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { RegisteredSubdomain } from "@/lib/subdomains"
import type { ShowcaseScreenshot } from "@/lib/screenshot-manifest"

const getRegisteredSubdomains = vi.fn()
const getScreenshotManifest = vi.fn()

vi.mock("@/lib/subdomains", () => ({ getRegisteredSubdomains }))
vi.mock("@/lib/screenshot-manifest", () => ({ getScreenshotManifest }))

const { ShowcaseGrid, ShowcaseHighlights } = await import("./showcase-grid")

function entry(subdomain: string, github: string): RegisteredSubdomain {
  return {
    subdomain,
    owner: { github },
    records: {},
    createdOn: "2026-01-01T00:00:00Z",
    updatedOn: "2026-01-01T00:00:00Z",
  }
}

function capture(subdomain: string): ShowcaseScreenshot {
  return {
    portfolioId: subdomain,
    subdomain,
    ownerGithub: "owner",
    screenshotStatus: "ready",
    screenshotKey: `showcase/${subdomain}/preview-v1.jpeg`,
    screenshotUrl: `https://cdn.is-pinoy.dev/showcase/${subdomain}/preview-v1.jpeg`,
    screenshotCapturedAt: "2026-01-01T00:00:00Z",
    screenshotRequestedAt: null,
    screenshotFailureReason: null,
    screenshotRetryCount: 0,
    screenshotVersion: 1,
  }
}

/** The subdomains a rendered surface names, in the order it named them. */
function orderOf(html: string): string[] {
  return [
    ...html.matchAll(/href="https:\/\/([a-z0-9-]+)\.is-pinoy\.dev"/g),
  ].map((match) => match[1]!)
}

async function render(element: Promise<React.ReactElement>): Promise<string> {
  return renderToStaticMarkup(await element)
}

// Registry order is newest-first; `alpha` is the most recently claimed.
const REGISTRY = [
  entry("alpha", "one"),
  entry("bravo", "two"),
  entry("charlie", "three"),
  entry("delta", "four"),
]

describe("ShowcaseHighlights", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRegisteredSubdomains.mockResolvedValue(REGISTRY)
    getScreenshotManifest.mockResolvedValue(new Map())
  })

  it("shows the newest entries in registry order", async () => {
    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["alpha", "bravo", "charlie"])
  })

  it("does not float an entry forward for having a stored capture", async () => {
    // `delta` is the oldest entry and the only captured one. Promoting it would
    // put the landing page out of step with /showcase about what is newest.
    getScreenshotManifest.mockResolvedValue(
      new Map([["delta", capture("delta")]])
    )

    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["alpha", "bravo", "charlie"])
  })

  it("leads with the same entries the showcase grid leads with", async () => {
    getScreenshotManifest.mockResolvedValue(
      new Map([["charlie", capture("charlie")]])
    )

    const [highlights, grid] = await Promise.all([
      render(ShowcaseHighlights()),
      render(ShowcaseGrid()),
    ])

    expect(orderOf(highlights)).toEqual(orderOf(grid).slice(0, 3))
  })

  it("frames every preview at the same aspect ratio as the grid", async () => {
    const [highlights, grid] = await Promise.all([
      render(ShowcaseHighlights()),
      render(ShowcaseGrid()),
    ])

    // A preview must not change shape depending on which page it is seen on.
    expect(highlights).toContain("aspect-[1200/630]")
    expect(grid).toContain("aspect-[1200/630]")
    expect(highlights).not.toContain("aspect-video")
  })

  it("renders every card the same size", async () => {
    // The section used to size one card differently from the other two, which
    // cropped their previews to a sliver.
    const html = await render(ShowcaseHighlights())
    const frames = html.match(/aspect-\[1200\/630\]/g)

    expect(frames).toHaveLength(3)
  })

  it("prompts for the first claim when nothing is registered", async () => {
    getRegisteredSubdomains.mockResolvedValue([])

    const html = await render(ShowcaseHighlights())

    expect(html).toContain("No sites yet")
    expect(orderOf(html)).toEqual([])
  })

  it("shows what there is when fewer than three are registered", async () => {
    getRegisteredSubdomains.mockResolvedValue(REGISTRY.slice(0, 2))

    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["alpha", "bravo"])
  })

  it("passes a stored capture through to the card that shows it", async () => {
    getScreenshotManifest.mockResolvedValue(
      new Map([["alpha", capture("alpha")]])
    )

    const html = await render(ShowcaseHighlights())

    expect(html).toContain(
      "https://cdn.is-pinoy.dev/showcase/alpha/preview-v1.jpeg"
    )
    // Entries without one fall to the ranked preview endpoint, not to nothing.
    expect(html).toContain("/_tools/og/preview?subdomain=bravo")
  })
})
