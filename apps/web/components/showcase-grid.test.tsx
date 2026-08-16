import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { RegisteredSubdomain } from "@/lib/subdomains"
import type { ShowcaseScreenshot } from "@/lib/screenshot-manifest"
import type { ShowcaseVisitSummary } from "@/lib/visit-count"

const getRegisteredSubdomains = vi.fn()
const getScreenshotManifest = vi.fn()
const getCapturedSubdomains = vi.fn()
const getShowcaseVisits = vi.fn()

vi.mock("@/lib/subdomains", () => ({ getRegisteredSubdomains }))
vi.mock("@/lib/screenshot-manifest", () => ({ getScreenshotManifest }))
vi.mock("@/lib/captured-subdomains", () => ({ getCapturedSubdomains }))
vi.mock("@/lib/visits", () => ({ getShowcaseVisits }))

const { ShowcaseGrid, ShowcaseHighlights } = await import("./showcase-grid")

function entry(
  subdomain: string,
  github: string,
  overrides: Partial<RegisteredSubdomain> = {}
): RegisteredSubdomain {
  return {
    subdomain,
    owner: { github },
    records: {},
    portfolio: null,
    createdOn: "2026-01-01T00:00:00Z",
    updatedOn: "2026-01-01T00:00:00Z",
    ...overrides,
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

/** Visit totals as lib/visits returns them, one entry per named subdomain. */
function visits(
  totals: Record<string, number>
): Map<string, ShowcaseVisitSummary> {
  return new Map(
    Object.entries(totals).map(([subdomain, total]) => [
      subdomain,
      { total, windowDays: 30, through: "2026-01-18" },
    ])
  )
}

/**
 * A Monday whose rotation window starts at the head of a four-entry pool. The
 * section rotates weekly, so every expectation here is anchored to a fixed
 * clock rather than to whenever the suite happens to run.
 */
const WEEK_ONE = new Date("2026-01-19T00:00:00Z")
const WEEK_TWO = new Date("2026-01-26T00:00:00Z")

describe("ShowcaseHighlights", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(WEEK_ONE)
    getRegisteredSubdomains.mockResolvedValue(REGISTRY)
    getScreenshotManifest.mockResolvedValue(
      captures(...REGISTRY.map((e) => e.subdomain))
    )
    // The og Worker answered and knows of no captures, so every expectation
    // below rests on the manifest unless it says otherwise.
    getCapturedSubdomains.mockResolvedValue(new Set())
    // Collection is configured but has stored nothing, so no card mentions
    // visits unless the test says it should.
    getShowcaseVisits.mockResolvedValue(new Map())
  })

  afterEach(() => {
    vi.useRealTimers()
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
    // Filtering decides which entries qualify and rotation decides when their
    // turn comes; neither reshuffles registry order within a week's window.
    getScreenshotManifest.mockResolvedValue(
      captures("charlie", "delta", "alpha")
    )

    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["alpha", "charlie", "delta"])
  })

  it("counts a capture the og worker knows about but the manifest does not", async () => {
    // The card images resolve captures through that Worker, so anything it can
    // photograph belongs on the landing page even when the manifest — a second
    // path, behind a shared secret — comes back empty.
    getScreenshotManifest.mockResolvedValue(new Map())
    getCapturedSubdomains.mockResolvedValue(new Set(["bravo", "charlie"]))

    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["bravo", "charlie"])
  })

  it("shows the newest entries when neither source can answer", async () => {
    // A failure to ask is ours, not news about the community: reporting it as
    // "no previews yet" would empty the section over an outage.
    getScreenshotManifest.mockResolvedValue(new Map())
    getCapturedSubdomains.mockResolvedValue(null)

    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["alpha", "bravo", "charlie"])
  })

  it("keeps filtering on the manifest when the og worker cannot answer", async () => {
    getScreenshotManifest.mockResolvedValue(captures("delta"))
    getCapturedSubdomains.mockResolvedValue(null)

    const html = await render(ShowcaseHighlights())

    expect(orderOf(html)).toEqual(["delta"])
  })

  it("holds the same entries for the rest of the week", async () => {
    const monday = await render(ShowcaseHighlights())
    vi.setSystemTime(new Date("2026-01-25T23:59:59Z"))
    const sunday = await render(ShowcaseHighlights())

    expect(orderOf(sunday)).toEqual(orderOf(monday))
  })

  it("features different entries the following week", async () => {
    const first = orderOf(await render(ShowcaseHighlights()))
    vi.setSystemTime(WEEK_TWO)
    const second = orderOf(await render(ShowcaseHighlights()))

    expect(first).toEqual(["alpha", "bravo", "charlie"])
    expect(second).toEqual(["delta", "alpha", "bravo"])
  })

  it("rotates only through entries that have a screenshot", async () => {
    // `bravo` is uncaptured, so no week may feature it.
    getScreenshotManifest.mockResolvedValue(
      captures("alpha", "charlie", "delta")
    )

    for (const week of [WEEK_ONE, WEEK_TWO]) {
      vi.setSystemTime(week)
      expect(orderOf(await render(ShowcaseHighlights()))).not.toContain("bravo")
    }
  })

  it("does not rotate the showcase grid", async () => {
    // Rotation is a landing-page affordance; /showcase stays a stable list.
    const first = orderOf(await render(ShowcaseGrid()))
    vi.setSystemTime(WEEK_TWO)
    const second = orderOf(await render(ShowcaseGrid()))

    expect(second).toEqual(first)
  })

  it("keeps every registered entry in the showcase grid", async () => {
    // Only the landing page is filtered — /showcase still lists everyone.
    getScreenshotManifest.mockResolvedValue(captures("alpha"))

    const html = await render(ShowcaseGrid())

    expect(orderOf(html)).toEqual(["alpha", "bravo", "charlie", "delta"])
  })

  it("labels each card by who built what the subdomain points at", async () => {
    getRegisteredSubdomains.mockResolvedValue([
      entry("alpha", "one", { portfolio: { template: "terminal" } }),
      entry("bravo", "two", {
        records: { CNAME: { value: "bravo.github.io" } },
      }),
      entry("charlie", "three", {
        records: { CNAME: { value: "abc.vercel-dns-017.com." } },
      }),
    ])

    const html = await render(ShowcaseGrid())

    expect(html).toContain("GitHub Profile")
    // The other two are sites their owners built, on hosts the showcase does
    // not name — both read the same.
    expect(html.match(/Portfolio</g)).toHaveLength(2)
  })

  it("shows each card's visit total on both surfaces", async () => {
    getShowcaseVisits.mockResolvedValue(visits({ alpha: 1240 }))

    const [grid, highlights] = await Promise.all([
      render(ShowcaseGrid()),
      render(ShowcaseHighlights()),
    ])

    // Compact past a thousand on both, with the exact figure and the day it
    // runs to behind it.
    expect(grid).toContain("1.2K visits")
    expect(highlights).toContain("1.2K visits")
    for (const html of [grid, highlights]) {
      expect(html).toContain(
        "1,240 visits in the last 30 days (through 2026-01-18)"
      )
    }
  })

  it("states the window it covers on every surface that shows a figure", async () => {
    getShowcaseVisits.mockResolvedValue(visits({ alpha: 1240 }))

    const [grid, highlights] = await Promise.all([
      render(ShowcaseGrid()),
      render(ShowcaseHighlights()),
    ])

    // A total with no window attached reads as all-time, and a tooltip is no
    // answer on a phone. The grid says it once above cards too narrow to
    // repeat it on; the landing card says it on the figure itself.
    expect(grid).toContain("Visits · last 30 days")
    expect(highlights).toContain("1.2K visits · 30d")
  })

  it("leaves the window unsaid when no card carries a figure", async () => {
    const html = await render(ShowcaseGrid())

    expect(html).not.toContain("Visits · last 30 days")
  })

  it("says nothing about visits for a subdomain with no total", async () => {
    // `bravo` opted out of collection, or has simply never been collected —
    // either way the card must not invent a figure or draw an empty one.
    getShowcaseVisits.mockResolvedValue(visits({ alpha: 1240 }))

    const html = await render(ShowcaseGrid())
    const counted = [...html.matchAll(/visits in the last/g)]

    expect(counted).toHaveLength(1)
  })

  it("drops a zero rather than printing it under somebody's site", async () => {
    getShowcaseVisits.mockResolvedValue(visits({ alpha: 0 }))

    const html = await render(ShowcaseGrid())

    expect(html).not.toContain("0 visits")
    expect(html).not.toMatch(/visits/i)
  })

  it("renders cards unchanged when the totals cannot be read", async () => {
    // An unreachable analytics database is our problem, not news for a
    // visitor: the cards lose a figure and nothing else.
    getShowcaseVisits.mockResolvedValue(null)

    const html = await render(ShowcaseGrid())

    expect(orderOf(html)).toEqual(["alpha", "bravo", "charlie", "delta"])
    expect(html).not.toMatch(/visits/i)
  })

  it("does not let visit totals reorder or filter the showcase", async () => {
    // The grid is the registry, in registry order. A busy subdomain does not
    // buy a better slot and a quiet one does not lose its place.
    getShowcaseVisits.mockResolvedValue(visits({ delta: 90_000, bravo: 12 }))

    const html = await render(ShowcaseGrid())

    expect(orderOf(html)).toEqual(["alpha", "bravo", "charlie", "delta"])
  })

  it("keeps the shared preview ratio when the bento stacks", async () => {
    const [highlights, grid] = await Promise.all([
      render(ShowcaseHighlights()),
      render(ShowcaseGrid()),
    ])

    // At mobile and tablet widths every card stacks with the same frame as the
    // full grid. The desktop bento intentionally lets that frame fill its cell.
    expect(highlights).toContain("aspect-[1200/630]")
    expect(grid).toContain("aspect-[1200/630]")
    expect(highlights).toContain("lg:aspect-auto")
    expect(highlights).not.toContain("aspect-video")
  })

  it("gives the weekly feature a deliberate bento hierarchy", async () => {
    const html = await render(ShowcaseHighlights())
    const frames = html.match(/aspect-\[1200\/630\]/g)

    expect(frames).toHaveLength(3)
    expect(html).toContain("lg:row-span-2")
    expect(html).toContain("Featured this week")
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
