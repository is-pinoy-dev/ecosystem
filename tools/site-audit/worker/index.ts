import { createRequestHandler } from "@react-router/cloudflare";
// @ts-ignore - build/server is generated at compile time and won't exist during typecheck
import * as build from "../build/server";

const handleRequest = createRequestHandler({
  build,
  getLoadContext: ({ request, context }) => ({
    cloudflare: {
      env: context.cloudflare.env,
      cf: (request as Request & { cf?: IncomingRequestCfProperties }).cf,
      ctx: context.cloudflare.ctx,
      caches: typeof caches !== "undefined" ? caches : undefined,
    },
  }),
});

const PREFIX = "/_tools/site-audit";
const DOMAINS_RAW_BASE =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/domains";
const FEATURE_CACHE_TTL = 300; // 5 minutes

export interface Env {
  ASSETS: Fetcher;
}

async function isSiteAuditEnabled(
  subdomain: string,
  ctx: ExecutionContext
): Promise<boolean> {
  const cacheKey = `https://feature-cache.internal/domains/${subdomain}.json`;

  if (typeof caches !== "undefined") {
    const cached = await caches.default.match(cacheKey);
    if (cached) {
      const data = await cached.json<{ features?: { tools?: { "site-audit"?: boolean } } }>();
      return data.features?.tools?.["site-audit"] === true;
    }
  }

  const res = await fetch(`${DOMAINS_RAW_BASE}/${subdomain}.json`);
  if (!res.ok) return false;

  const data = await res.json<{ features?: { tools?: { "site-audit"?: boolean } } }>();

  if (typeof caches !== "undefined") {
    ctx.waitUntil(
      caches.default.put(
        cacheKey,
        new Response(JSON.stringify(data), {
          headers: { "Cache-Control": `max-age=${FEATURE_CACHE_TTL}` },
        })
      )
    );
  }

  return data.features?.tools?.["site-audit"] === true;
}

function notEnabledResponse(subdomain: string): Response {
  const html = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Site Audit — Not Enabled</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0a;
      color: #f5f5f5;
      font-family: 'Press Start 2P', monospace;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
    }
    .card {
      border: 2px solid #333;
      box-shadow: 4px 4px 0 #000;
      padding: 2rem;
      max-width: 480px;
      width: 100%;
    }
    .label { font-size: 9px; color: #F5C800; margin-bottom: 1.5rem; }
    h1 { font-size: 11px; margin-bottom: 1rem; line-height: 1.8; }
    p { font-size: 8px; color: #888; line-height: 2; margin-bottom: 1.5rem; }
    code {
      display: block;
      background: #111;
      border: 1px solid #333;
      padding: 1rem;
      font-size: 7px;
      line-height: 1.8;
      color: #aaa;
      white-space: pre;
    }
    .key { color: #F5C800; }
    .val { color: #7ec8e3; }
  </style>
</head>
<body>
  <div class="card">
    <div class="label">/_tools/site-audit</div>
    <h1>TOOL NOT ENABLED</h1>
    <p>Site Audit is not enabled for <strong style="color:#f5f5f5">${subdomain}.is-pinoy.dev</strong>.</p>
    <p>Add the following to your subdomain JSON to enable it:</p>
    <code><span class="key">"features"</span>: {
  <span class="key">"tools"</span>: {
    <span class="key">"site-audit"</span>: <span class="val">true</span>
  }
}</code>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 403,
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const hostParts = url.hostname.split(".");

    // For subdomains (e.g. juan.is-pinoy.dev), check feature flag.
    // Apex domain (is-pinoy.dev) is always allowed.
    if (hostParts.length > 2) {
      const subdomain = hostParts.slice(0, hostParts.length - 2).join(".");
      const enabled = await isSiteAuditEnabled(subdomain, ctx);
      if (!enabled) return notEnabledResponse(subdomain);
    }

    if (url.pathname.startsWith(PREFIX)) {
      url.pathname = url.pathname.slice(PREFIX.length) || "/";
    }
    const assetUrl = url.toString();

    if (env.ASSETS) {
      try {
        const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));
        if (assetResponse.status !== 404) return assetResponse;
      } catch {
        // fall through to SSR
      }
    }

    try {
      const cfContext = {
        request: request as Request & { cf?: IncomingRequestCfProperties },
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
      console.error("[site-audit] React Router threw:", err instanceof Error ? err.stack : String(err));
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
