import { describe, expect, it } from "vitest"

import {
  isSelfGeneratedOgImage,
  resolveScreenshotUrl,
  screenshotUrlFrom,
  type ScreenshotEnv,
} from "../screenshot"

const BASE = "https://cdn.is-pinoy.dev"

/** Minimal stand-in for the one D1 query this module makes. */
function stubDb(row: { screenshot_key: string | null } | null): ScreenshotEnv {
  return {
    SCREENSHOT_PUBLIC_BASE_URL: BASE,
    SCREENSHOT_DB: {
      prepare: () => ({
        bind: () => ({ first: async () => row }),
      }),
    } as unknown as D1Database,
  }
}

function throwingDb(): ScreenshotEnv {
  return {
    SCREENSHOT_PUBLIC_BASE_URL: BASE,
    SCREENSHOT_DB: {
      prepare: () => ({
        bind: () => ({
          first: async () => {
            throw new Error("D1 unavailable")
          },
        }),
      }),
    } as unknown as D1Database,
  }
}

describe("screenshotUrlFrom", () => {
  it("joins the public base to the stored key", () => {
    expect(screenshotUrlFrom(BASE, "showcase/juan/preview-v3.jpeg")).toBe(
      "https://cdn.is-pinoy.dev/showcase/juan/preview-v3.jpeg"
    )
  })

  it("tolerates a trailing slash on the base", () => {
    expect(screenshotUrlFrom(`${BASE}/`, "showcase/juan/preview-v1.jpeg")).toBe(
      "https://cdn.is-pinoy.dev/showcase/juan/preview-v1.jpeg"
    )
  })

  it("returns null rather than a URL built from a missing half", () => {
    // An unconfigured base must not yield "undefined/showcase/..." — that would
    // 404 as though the capture itself had gone missing.
    expect(screenshotUrlFrom(undefined, "showcase/juan/preview-v1.jpeg")).toBe(
      null
    )
    expect(screenshotUrlFrom(BASE, null)).toBeNull()
    expect(screenshotUrlFrom(BASE, undefined)).toBeNull()
  })
})

describe("resolveScreenshotUrl", () => {
  it("returns the capture stored for the portfolio", async () => {
    await expect(
      resolveScreenshotUrl(
        "juan",
        stubDb({ screenshot_key: "showcase/juan/preview-v3.jpeg" })
      )
    ).resolves.toBe("https://cdn.is-pinoy.dev/showcase/juan/preview-v3.jpeg")
  })

  it("returns null for a portfolio that has never been captured", async () => {
    await expect(
      resolveScreenshotUrl("juan", stubDb({ screenshot_key: null }))
    ).resolves.toBeNull()
  })

  it("returns null for a portfolio the table does not know", async () => {
    await expect(resolveScreenshotUrl("juan", stubDb(null))).resolves.toBeNull()
  })

  it("returns null when no database is bound", async () => {
    // Local dev and preview deploys run without the binding; the card still has
    // to render, just without a capture behind it.
    await expect(
      resolveScreenshotUrl("juan", { SCREENSHOT_PUBLIC_BASE_URL: BASE })
    ).resolves.toBeNull()
  })

  it("returns null when the query throws", async () => {
    await expect(resolveScreenshotUrl("juan", throwingDb())).resolves.toBeNull()
  })
})

describe("isSelfGeneratedOgImage", () => {
  it("recognises the card this Worker generates", () => {
    // Portfolios we host declare exactly this as their og:image.
    expect(
      isSelfGeneratedOgImage("https://juan.is-pinoy.dev/_tools/og/image")
    ).toBe(true)
    expect(isSelfGeneratedOgImage("https://is-pinoy.dev/_tools/og/image")).toBe(
      true
    )
  })

  it("leaves a portfolio's own artwork alone", () => {
    expect(
      isSelfGeneratedOgImage("https://juan.is-pinoy.dev/assets/cover.png")
    ).toBe(false)
    expect(isSelfGeneratedOgImage("https://cdn.example/cover.png")).toBe(false)
  })

  it("is not fooled by a lookalike host", () => {
    expect(
      isSelfGeneratedOgImage(
        "https://is-pinoy.dev.evil.example/_tools/og/image"
      )
    ).toBe(false)
  })

  it("returns false for a value that is not a URL", () => {
    expect(isSelfGeneratedOgImage("not a url")).toBe(false)
  })
})
