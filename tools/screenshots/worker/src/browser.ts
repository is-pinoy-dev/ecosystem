import puppeteer from "@cloudflare/puppeteer"

import { isNavigationTimeout, ScreenshotError } from "./errors"
import {
  assertCanonicalPortfolioUrl,
  assertPublicDns,
  assertSafeResourceUrl,
} from "./security"
import type { CaptureResult } from "./types"

export interface ScreenshotBrowser {
  capture(url: URL, portfolioId: string): Promise<CaptureResult>
}

/**
 * How long to let a portfolio load, and how quiet it has to go first.
 *
 * `networkidle2` rather than `networkidle0`: a real portfolio keeps a couple of
 * connections open more or less forever — an analytics beacon, an embedded map,
 * a font service — and demanding total silence means waiting for something that
 * never comes.
 */
const NAVIGATION_WAIT = "networkidle2" as const
const NAVIGATION_TIMEOUT_MS = 45_000

const PRESENTATION_CSS = `
html {
  scroll-behavior: auto !important;
}
body {
  overflow: hidden !important;
}
*,
*::before,
*::after {
  caret-color: transparent !important;
  transition-duration: 0s !important;
}
`

export class CloudflareBrowser implements ScreenshotBrowser {
  constructor(private readonly binding: Fetcher) {}

  async capture(url: URL, portfolioId: string): Promise<CaptureResult> {
    assertCanonicalPortfolioUrl(url, portfolioId)
    await assertPublicDns(url.hostname)

    const browser = await puppeteer.launch(this.binding)
    try {
      const page = await browser.newPage()
      await page.setViewport({
        width: 1440,
        height: 900,
        deviceScaleFactor: 1,
      })
      await page.emulateMediaFeatures([
        { name: "prefers-reduced-motion", value: "reduce" },
      ])

      await page.setRequestInterception(true)
      let blockedNavigationError: ScreenshotError | null = null
      page.on("request", async (request) => {
        const mainNavigation =
          request.isNavigationRequest() && request.frame() === page.mainFrame()
        try {
          const resourceUrl = assertSafeResourceUrl(request.url())
          if (resourceUrl && mainNavigation) {
            assertCanonicalPortfolioUrl(resourceUrl, portfolioId)
            await assertPublicDns(resourceUrl.hostname)
          }
          await request.continue()
        } catch (error) {
          if (mainNavigation && error instanceof ScreenshotError) {
            blockedNavigationError = error
          }
          await request.abort("blockedbyclient")
        }
      })

      // Kept aside so a navigation that arrives but never settles can still be
      // judged on the response it did get.
      let mainResponse: Awaited<ReturnType<typeof page.goto>> = null
      page.on("response", (received) => {
        const request = received.request()
        if (
          request.isNavigationRequest() &&
          request.frame() === page.mainFrame()
        ) {
          mainResponse = received
        }
      })

      let response: Awaited<ReturnType<typeof page.goto>> = null
      let settled = true
      try {
        response = await page.goto(url.href, {
          waitUntil: NAVIGATION_WAIT,
          timeout: NAVIGATION_TIMEOUT_MS,
        })
      } catch (error) {
        if (blockedNavigationError) throw blockedNavigationError
        if (!isNavigationTimeout(error)) throw error
        // Running out of patience is not the same as failing to load. A page
        // that rendered and then kept chattering is still worth photographing,
        // and the usability check below is what decides whether it rendered.
        settled = false
      }

      const landed = response ?? mainResponse
      if (!landed) {
        throw new ScreenshotError(
          settled ? "dns_connection_failure" : "timeout"
        )
      }
      if (landed.status() >= 400) throw new ScreenshotError("http_error")
      assertCanonicalPortfolioUrl(page.url(), portfolioId)

      await new Promise((resolve) => setTimeout(resolve, 2_500))
      await page.addStyleTag({ content: PRESENTATION_CSS })
      await new Promise((resolve) => setTimeout(resolve, 100))

      const usable = await page.evaluate(() => {
        const pageDocument = (
          globalThis as unknown as {
            document: {
              body: {
                childElementCount: number
                textContent: string | null
              } | null
              documentElement: {
                clientWidth: number
                clientHeight: number
              } | null
            }
          }
        ).document
        const body = pageDocument.body
        const root = pageDocument.documentElement
        return Boolean(
          body &&
          root &&
          root.clientWidth > 0 &&
          root.clientHeight > 0 &&
          (body.childElementCount > 0 || body.textContent?.trim())
        )
      })
      if (!usable) throw new ScreenshotError("blank_result")

      const screenshot = await page.screenshot({
        fullPage: false,
        type: "jpeg",
        quality: 85,
      })
      const bytes =
        screenshot instanceof Uint8Array
          ? screenshot
          : new Uint8Array(screenshot)
      if (bytes.byteLength < 4_096) {
        throw new ScreenshotError("blank_result")
      }
      return { bytes, contentType: "image/jpeg", settled }
    } finally {
      await browser.close()
    }
  }
}
