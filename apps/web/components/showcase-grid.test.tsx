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

/** Manifest holding a ready capture for each named subdomain. */
function captures(...subdomains: string[]): Map<string, ShowcaseScreenshot> {
  return new Map(subdomains.map((name) => [name, capture(name)]))
}

describe("ShowcaseHighlights", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getRegisteredSubdomains.mockResolvedValue(REGISTRY)
    getScreenshotManifest.mockResolvedValue(
      captures(...REGISTRY.map((e) => e.subdomain))
    )
  })

  it("shows the newest captured entries in registry order", async () => {
    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["alpha", "bravo", "charlie"])
  })

  it("shows only entries that have a screenshot", async () => {
    // `bravo` and `charlie` have no capture, so the landing page would present
    // them through a generated OG card rather than the site itself.
    getScreenshotManifest.mockResolvedValue(captures("alpha", "delta"))

    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["alpha", "delta"])
  })

  it("does not float a captured entry ahead of an older captured one", async () => {
    // Filtering decides which entries qualify; it never reorders the ones that
    // do, so the section stays in step with /showcase about what is newest.
    getScreenshotManifest.mockResolvedValue(
      captures("charlie", "delta", "alpha")
    )

    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["alpha", "charlie", "delta"])
  })

  it("leads with the same entries the showcase grid leads with", async () => {
    const [highlights, grid] = await Promise.all([
      render(ShowcaseHighlights()),
      render(ShowcaseGrid()),
    ])

    expect(orderOf(highlights)).toEqual(orderOf(grid).slice(0, 3))
  })

  it("keeps every registered entry in the showcase grid", async () => {
    // Only the landing page is filtered — /showcase still lists everyone.
    getScreenshotManifest.mockResolvedValue(captures("alpha"))

    const html = await render(ShowcaseGrid())

    expect(orderOf(html)).toEqual(["alpha", "bravo", "charlie", "delta"])
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
    getScreenshotManifest.mockResolvedValue(new Map())

    const html = await render(ShowcaseHighlights())

    expect(html).toContain("No sites yet")
    expect(orderOf(html)).toEqual([])
  })

  it("points at the showcase when entries are registered but uncaptured", async () => {
    // Inviting the first claim would be wrong copy for a registry that already
    // has entries waiting on the screenshot worker.
    getScreenshotManifest.mockResolvedValue(new Map())

    const html = await render(ShowcaseHighlights())

    expect(html).toContain("Previews on the way")
    expect(html).not.toContain("No sites yet")
    expect(orderOf(html)).toEqual([])
  })

  it("shows what there is when fewer than three are captured", async () => {
    getScreenshotManifest.mockResolvedValue(captures("alpha", "bravo"))

    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["alpha", "bravo"])
  })

  it("passes a stored capture through to the card that shows it", async () => {
    getScreenshotManifest.mockResolvedValue(captures("alpha"))

    const html = await render(ShowcaseHighlights())

    expect(html).toContain(
      "https://cdn.is-pinoy.dev/showcase/alpha/preview-v1.jpeg"
    )
  })
})
