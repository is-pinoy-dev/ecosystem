import { createRequestHandler } from "@react-router/cloudflare";
// @ts-ignore - build/server is generated at compile time and won't exist during typecheck
import * as build from "../build/server";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
import { buildSvg, type OgData } from "./generate";

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
});

const PREFIX = "/_tools/og";
const IMAGE_PATH = "/_tools/og/image";
const DOMAINS_RAW_BASE =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains";
const DOMAIN_CACHE_TTL = 300;
const IMAGE_CACHE_TTL = 300;

export interface Env {
  ASSETS: Fetcher;
}

/** Returns null for apex domain (is-pinoy.dev), otherwise the subdomain label. */
function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");
  return parts.length > 2 ? parts.slice(0, parts.length - 2).join(".") : null;
}

// Module-level WASM init — runs once per isolate lifetime
let wasmReady: Promise<void> | null = null;

async function ensureWasm(env: Env, origin: string): Promise<void> {
  if (wasmReady) return wasmReady;
  wasmReady = (async () => {
    const wasmRes = await env.ASSETS.fetch(`${origin}/resvg.wasm`);
    if (!wasmRes.ok) throw new Error("Failed to fetch resvg.wasm from ASSETS");
    await initWasm(wasmRes);
  })();
  return wasmReady;
}

async function fetchSubdomainData(
  subdomain: string,
  ctx: ExecutionContext
): Promise<OgData> {
  const cacheKey = `https://domain-cache.internal/${subdomain}.json`;

  if (typeof caches !== "undefined") {
    const cached = await caches.default.match(cacheKey);
    if (cached) {
      const data = await cached.json<{ owner?: { github?: string } }>();
      return { subdomain, owner: data.owner?.github ?? subdomain, found: true };
    }
  }

  const res = await fetch(`${DOMAINS_RAW_BASE}/${subdomain}.json`, {
    headers: { "User-Agent": "is-pinoy-dev-og/1.0" },
  });

  if (!res.ok) return { subdomain, owner: "", found: false };

  const data = await res.json<{ owner?: { github?: string } }>();

  if (typeof caches !== "undefined") {
    ctx.waitUntil(
      caches.default.put(
        cacheKey,
        new Response(JSON.stringify(data), {
          headers: { "Cache-Control": `max-age=${DOMAIN_CACHE_TTL}` },
        })
      )
    );
  }

  return { subdomain, owner: data.owner?.github ?? subdomain, found: true };
}

async function loadFont(env: Env, origin: string): Promise<ArrayBuffer> {
  const fontKey = `${origin}/PressStart2P-Regular.ttf`;
  if (typeof caches !== "undefined") {
    const cached = await caches.default.match(fontKey);
    if (cached) return cached.arrayBuffer();
  }
  const res = await env.ASSETS.fetch(fontKey);
  if (!res.ok) throw new Error("Failed to load font from ASSETS");
  return res.arrayBuffer();
}

async function generateOgPng(
  ogData: OgData,
  fontBuffer: ArrayBuffer
): Promise<Uint8Array> {
  const svg = buildSvg(ogData);
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { fontBuffers: [new Uint8Array(fontBuffer)] },
  });
  return resvg.render().asPng();
}

async function handleImageRequest(
  subdomain: string,
  request: Request,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> {
  const url = new URL(request.url);
  const imageCacheKey = `https://og-cache.internal/${subdomain}.png`;

  if (typeof caches !== "undefined") {
    const cached = await caches.default.match(imageCacheKey);
    if (cached) return cached;
  }

  await ensureWasm(env, url.origin);
  const [ogData, fontBuffer] = await Promise.all([
    fetchSubdomainData(subdomain, ctx),
    loadFont(env, url.origin),
  ]);

  const png = await generateOgPng(ogData, fontBuffer);
  const response = new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": `public, max-age=${IMAGE_CACHE_TTL}`,
    },
  });

  if (typeof caches !== "undefined") {
    ctx.waitUntil(caches.default.put(imageCacheKey, response.clone()));
  }

  return response;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const subdomain = extractSubdomain(url.hostname);

    // /_tools/og/image — return the PNG for this subdomain
    if (url.pathname === IMAGE_PATH || url.pathname === `${IMAGE_PATH}/`) {
      if (!subdomain) {
        return new Response("OG image is only available on subdomains", {
          status: 400,
        });
      }
      try {
        return await handleImageRequest(subdomain, request, env, ctx);
      } catch (err) {
        console.error(
          "[og] image generation failed:",
          err instanceof Error ? err.stack : String(err)
        );
        return new Response("Image generation failed", { status: 500 });
      }
    }

    // Strip prefix and serve static assets
    if (url.pathname.startsWith(PREFIX)) {
      url.pathname = url.pathname.slice(PREFIX.length) || "/";
    }
    const assetUrl = url.toString();

    if (env.ASSETS) {
      try {
        const assetResponse = await env.ASSETS.fetch(
          new Request(assetUrl, request)
        );
        if (assetResponse.status !== 404) return assetResponse;
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
      };
      return await handleRequest(cfContext);
    } catch (err) {
      console.error(
        "[og] React Router threw:",
        err instanceof Error ? err.stack : String(err)
      );
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
