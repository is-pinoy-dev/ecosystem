import { createRequestHandler } from "@react-router/cloudflare"
// @ts-ignore - build/server is generated at compile time and won't exist during typecheck
import * as build from "../build/server"
import { Resvg, initWasm } from "@resvg/resvg-wasm"
import { buildSvg, type OgData } from "./generate"
import { resolvePortfolioOgImage, resolveRequestedSubdomain } from "./preview"
import {
  isSelfGeneratedOgImage,
  listCapturedSubdomains,
  resolveScreenshotUrl,
  type ScreenshotEnv,
} from "./screenshot"
// @ts-ignore - resvg.wasm is copied to worker/ at build time and pre-compiled by wrangler
import resvgWasmModule from "./resvg.wasm"

const handleRequest = createRequestHandler({
  build,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLoadContext: ({ request, context }: any) => ({
    cloudflare: {
      env: context.cloudflare.env,
      cf: request.cf,
      ctx: context.cloudflare.ctx,
      caches,
    },
  }),
})

const PREFIX = "/_tools/og"
const IMAGE_PATH = "/_tools/og/image"
const PREVIEW_PATH = "/_tools/og/preview"
const CAPTURED_PATH = "/_tools/og/captured"
const DOMAINS_RAW_BASE =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains"
const DOMAIN_CACHE_TTL = 300
const IMAGE_CACHE_TTL = 300
const PREVIEW_CACHE_TTL = 3600
// Captures land on a daily cron, so a few minutes of staleness costs nothing
// and keeps a burst of renders off D1.
const CAPTURED_CACHE_TTL = 300
const MAX_PREVIEW_BYTES = 4 * 1024 * 1024

export interface Env extends ScreenshotEnv {
  ASSETS: Fetcher
}

// Module-level WASM init — runs once per isolate lifetime
let wasmReady: Promise<void> | null = null

async function ensureWasm(): Promise<void> {
  if (wasmReady) return wasmReady
  wasmReady = initWasm(resvgWasmModule)
  return wasmReady
}

async function fetchSubdomainData(
  subdomain: string,
  ctx: ExecutionContext
): Promise<OgData> {
  const cacheKey = `https://domain-cache.internal/${subdomain}.json`

  if (typeof caches !== "undefined") {
    const cached = await caches.default.match(cacheKey)
    if (cached) {
      const data = await cached.json<{ owner?: { github?: string } }>()
      return { subdomain, owner: data.owner?.github ?? subdomain, found: true }
    }
  }

  const res = await fetch(`${DOMAINS_RAW_BASE}/${subdomain}.json`, {
    headers: { "User-Agent": "is-pinoy-dev-og/1.0" },
  })

  if (!res.ok) return { subdomain, owner: "", found: false }

  const data = await res.json<{ owner?: { github?: string } }>()

  if (typeof caches !== "undefined") {
    ctx.waitUntil(
      caches.default.put(
        cacheKey,
        new Response(JSON.stringify(data), {
          headers: { "Cache-Control": `max-age=${DOMAIN_CACHE_TTL}` },
        })
      )
    )
  }

  return { subdomain, owner: data.owner?.github ?? subdomain, found: true }
}

async function loadAsset(
  env: Env,
  origin: string,
  pathname: string
): Promise<ArrayBuffer> {
  const assetKey = `${origin}/${pathname}`
  if (typeof caches !== "undefined") {
    const cached = await caches.default.match(assetKey)
    if (cached) return cached.arrayBuffer()
  }
  const res = await env.ASSETS.fetch(assetKey)
  if (!res.ok) throw new Error(`Failed to load ${pathname} from ASSETS`)
  return res.arrayBuffer()
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 32_768
  let binary = ""

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize))
  }

  return btoa(binary)
}

interface ImageAsset {
  buffer: ArrayBuffer
  contentType: string
}

async function fetchGithubAvatar(username: string): Promise<ImageAsset | null> {
  try {
    const res = await fetch(
      `https://github.com/${encodeURIComponent(username)}.png?size=128`,
      {
        headers: {
          Accept: "image/*",
          "User-Agent": "is-pinoy-dev-og/1.0",
        },
      }
    )

    const contentType = res.headers.get("content-type")?.split(";")[0] ?? ""
    if (!res.ok || !contentType.startsWith("image/")) return null

    return {
      buffer: await res.arrayBuffer(),
      contentType,
    }
  } catch {
    return null
  }
}

/**
 * Pull a stored capture down so it can be composited into the card. It comes
 * from our own bucket, but it is still a fetch that can fail or return
 * something unexpected, and it has to be decoded in memory — so anything that
 * is not a sanely sized image collapses to null and the branded card is drawn
 * instead.
 */
async function fetchScreenshot(url: string): Promise<ImageAsset | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "image/*" },
      redirect: "follow",
    })

    const contentType = res.headers.get("content-type")?.split(";")[0] ?? ""
    if (!res.ok || !contentType.startsWith("image/")) return null

    const buffer = await res.arrayBuffer()
    if (buffer.byteLength > MAX_PREVIEW_BYTES) return null

    return { buffer, contentType }
  } catch {
    return null
  }
}

async function generateOgPng(
  ogData: OgData,
  geistFont: ArrayBuffer,
  backgroundImage: ArrayBuffer,
  avatarImage: ImageAsset | null,
  screenshotImage: ImageAsset | null
): Promise<Uint8Array> {
  const backgroundDataUri = `data:image/jpeg;base64,${arrayBufferToBase64(backgroundImage)}`
  const avatarDataUri = avatarImage
    ? `data:${avatarImage.contentType};base64,${arrayBufferToBase64(avatarImage.buffer)}`
    : undefined
  const screenshotDataUri = screenshotImage
    ? `data:${screenshotImage.contentType};base64,${arrayBufferToBase64(screenshotImage.buffer)}`
    : undefined
  const svg = buildSvg(
    ogData,
    backgroundDataUri,
    avatarDataUri,
    screenshotDataUri
  )
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: {
      fontBuffers: [new Uint8Array(geistFont)],
    },
  })
  return resvg.render().asPng()
}

async function handleImageRequest(
  subdomain: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url)
  const imageCacheKey = `https://og-cache.internal/${subdomain}.png`

  if (typeof caches !== "undefined") {
    const cached = await caches.default.match(imageCacheKey)
    if (cached) return cached
  }

  await ensureWasm()
  const [ogData, geistFont, backgroundImage, screenshotUrl] = await Promise.all(
    [
      fetchSubdomainData(subdomain, ctx),
      loadAsset(env, url.origin, "Geist-SemiBold.ttf"),
      loadAsset(env, url.origin, "subdomain-og-background.jpg"),
      resolveScreenshotUrl(subdomain, env),
    ]
  )
  const [avatarImage, screenshotImage] = await Promise.all([
    ogData.found ? fetchGithubAvatar(ogData.owner) : null,
    ogData.found && screenshotUrl ? fetchScreenshot(screenshotUrl) : null,
  ])

  const png = await generateOgPng(
    ogData,
    geistFont,
    backgroundImage,
    avatarImage,
    screenshotImage
  )
  const response = new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": `public, max-age=${IMAGE_CACHE_TTL}`,
    },
  })

  if (typeof caches !== "undefined") {
    ctx.waitUntil(caches.default.put(imageCacheKey, response.clone()))
  }

  return response
}

/** Cached decision about a portfolio's own og:image — the URL, or null. */
async function cachedPortfolioOgImage(
  subdomain: string,
  ctx: ExecutionContext
): Promise<string | null> {
  const cacheKey = `https://og-preview.internal/${subdomain}.json`

  if (typeof caches !== "undefined") {
    const cached = await caches.default.match(cacheKey)
    if (cached) {
      const body = await cached.json<{ ogImage: string | null }>()
      return body.ogImage
    }
  }

  const ogImage = await resolvePortfolioOgImage(subdomain)

  if (typeof caches !== "undefined") {
    ctx.waitUntil(
      caches.default.put(
        cacheKey,
        new Response(JSON.stringify({ ogImage }), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `max-age=${PREVIEW_CACHE_TTL}`,
          },
        })
      )
    )
  }

  return ogImage
}

/**
 * The picture of a portfolio, ranked: the capture we took of it, then the
 * og:image it declares for itself, then the card this Worker generates. The
 * showcase and the landing page both render whatever this returns, so the
 * ranking is applied once here rather than per surface.
 *
 * Every rung is streamed through this Worker rather than redirected to.
 * Proxying keeps the response an image — a registered owner cannot point the
 * URL at a page and have our domain hand visitors off to it — and hides the
 * visitor from the third-party host. Anything short of a usable image falls
 * through to the next rung.
 */
async function handlePreviewRequest(
  subdomain: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  // Rung one: the capture the screenshot Worker took of this portfolio. It is
  // our own object on our own CDN, already immutable and long-cached there, so
  // it is streamed straight back rather than re-resolved on every request.
  const screenshotUrl = await resolveScreenshotUrl(subdomain, env)
  if (screenshotUrl) {
    const capture = await fetch(screenshotUrl, {
      headers: { Accept: "image/*" },
      redirect: "follow",
    }).catch(() => null)
    const captureType = capture?.headers.get("content-type")?.split(";")[0]
    if (capture?.ok && capture.body && captureType?.startsWith("image/")) {
      return new Response(capture.body, {
        headers: {
          "Content-Type": captureType,
          "Cache-Control": `public, max-age=${PREVIEW_CACHE_TTL}`,
        },
      })
    }
  }

  const ogImage = await cachedPortfolioOgImage(subdomain, ctx)

  // A portfolio we host declares this endpoint's own last rung as its og:image.
  // Following that would proxy the generated card to itself over the network.
  if (ogImage && !isSelfGeneratedOgImage(ogImage)) {
    try {
      const upstream = await fetch(ogImage, {
        headers: { Accept: "image/*" },
        redirect: "follow",
      })
      const contentType = upstream.headers.get("content-type")?.split(";")[0]
      const declaredLength = Number(upstream.headers.get("content-length") ?? 0)

      if (
        upstream.ok &&
        upstream.body &&
        contentType?.startsWith("image/") &&
        declaredLength <= MAX_PREVIEW_BYTES
      ) {
        return new Response(upstream.body, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": `public, max-age=${PREVIEW_CACHE_TTL}`,
          },
        })
      }
    } catch {
      // fall through to the generated card
    }
  }

  return handleImageRequest(subdomain, request, env, ctx)
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url)
    const subdomain = resolveRequestedSubdomain(url.hostname, url.searchParams)

    // /_tools/og/captured — which portfolios have a stored capture. Names only,
    // and only names already public in the domains repo, so this needs no
    // authentication; it is asked once per render, not once per card.
    if (
      url.pathname === CAPTURED_PATH ||
      url.pathname === `${CAPTURED_PATH}/`
    ) {
      const subdomains = await listCapturedSubdomains(env)
      // A caller that cannot tell "nothing captured" from "could not ask" would
      // present an empty showcase as fact, so say so with a status instead.
      if (subdomains === null) {
        return Response.json({ error: "unavailable" }, { status: 503 })
      }
      return Response.json(
        { subdomains },
        {
          headers: {
            "Cache-Control": `public, max-age=${CAPTURED_CACHE_TTL}`,
          },
        }
      )
    }

    // /_tools/og/preview — the portfolio's own og:image, else the generated card
    if (url.pathname === PREVIEW_PATH || url.pathname === `${PREVIEW_PATH}/`) {
      if (!subdomain) {
        return new Response("Name a subdomain to preview", { status: 400 })
      }
      try {
        return await handlePreviewRequest(subdomain, request, env, ctx)
      } catch (err) {
        console.error(
          "[og] preview failed:",
          err instanceof Error ? err.stack : String(err)
        )
        return new Response("Preview failed", { status: 500 })
      }
    }

    // /_tools/og/image — return the PNG for this subdomain
    if (url.pathname === IMAGE_PATH || url.pathname === `${IMAGE_PATH}/`) {
      if (!subdomain) {
        return new Response("OG image is only available on subdomains", {
          status: 400,
        })
      }
      try {
        return await handleImageRequest(subdomain, request, env, ctx)
      } catch (err) {
        console.error(
          "[og] image generation failed:",
          err instanceof Error ? err.stack : String(err)
        )
        return new Response("Image generation failed", { status: 500 })
      }
    }

    // Strip prefix and serve static assets
    if (url.pathname.startsWith(PREFIX)) {
      url.pathname = url.pathname.slice(PREFIX.length) || "/"
    }
    const assetUrl = url.toString()

    if (env.ASSETS) {
      try {
        const assetResponse = await env.ASSETS.fetch(
          new Request(assetUrl, request)
        )
        if (assetResponse.status !== 404) return assetResponse
      } catch {
        // fall through to SSR
      }
    }

    try {
      const cfContext = {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request: request as any,
        functionPath: "",
        waitUntil: ctx.waitUntil.bind(ctx),
        passThroughOnException: ctx.passThroughOnException.bind(ctx),
        next: () => Promise.resolve(new Response("Not Found", { status: 404 })),
        env,
        params: {},
        data: {},
      }
      return await handleRequest(cfContext)
    } catch (err) {
      console.error(
        "[og] React Router threw:",
        err instanceof Error ? err.stack : String(err)
      )
      return new Response("Internal Server Error", { status: 500 })
    }
  },
} satisfies ExportedHandler<Env>
