import { createRequestHandler } from "@react-router/cloudflare"
// @ts-ignore - build/server is generated at compile time and won't exist during typecheck
import * as build from "../build/server"

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

const PREFIX = "/_tools/site-audit"
const DOMAINS_RAW_BASE =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains"
const FEATURE_CACHE_TTL = 300 // 5 minutes

export interface Env {
  ASSETS: Fetcher
}

async function isSiteAuditEnabled(
  subdomain: string,
  ctx: ExecutionContext
): Promise<boolean> {
  const cacheKey = `https://feature-cache.internal/domains/${subdomain}.json`

  if (typeof caches !== "undefined") {
    const cached = await caches.default.match(cacheKey)
    if (cached) {
      const data = await cached.json<{
        features?: { tools?: { "site-audit"?: boolean } }
      }>()
      const enabled = data.features?.tools?.["site-audit"] === true
      console.log(
        `[site-audit] feature check subdomain=${subdomain} source=cache enabled=${enabled}`
      )
      return enabled
    }
  }

  const fetchUrl = `${DOMAINS_RAW_BASE}/${subdomain}.json`
  console.log(
    `[site-audit] fetching config subdomain=${subdomain} url=${fetchUrl}`
  )
  const res = await fetch(fetchUrl)
  if (!res.ok) {
    console.warn(
      `[site-audit] config fetch failed subdomain=${subdomain} status=${res.status}`
    )
    return false
  }

  const data = await res.json<{
    features?: { tools?: { "site-audit"?: boolean } }
  }>()
  const enabled = data.features?.tools?.["site-audit"] === true
  console.log(
    `[site-audit] feature check subdomain=${subdomain} source=fetch enabled=${enabled}`
  )

  if (typeof caches !== "undefined") {
    ctx.waitUntil(
      caches.default.put(
        cacheKey,
        new Response(JSON.stringify(data), {
          headers: { "Cache-Control": `max-age=${FEATURE_CACHE_TTL}` },
        })
      )
    )
  }

  return enabled
}

function notEnabledResponse(subdomain: string): Response {
  const snippet = JSON.stringify(
    { features: { tools: { "site-audit": true } } },
    null,
    2
  )
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#fdfcfa" />
  <title>Site Audit — Not Enabled</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #fdfcfa;
      color: #0b1f44;
      font-family: 'IBM Plex Sans', Arial, sans-serif;
      font-size: 16px;
      line-height: 1.7;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 40px 20px;
    }
    .card {
      border: 1px solid #ded9cd;
      background: #ffffff;
      padding: 40px;
      max-width: 640px;
      width: 100%;
    }
    .label {
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #175cd3;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 32px;
      font-weight: 600;
      letter-spacing: -0.03em;
      line-height: 1.25;
      margin-bottom: 16px;
    }
    p { color: #667085; margin-bottom: 16px; }
    p strong { color: #0b1f44; font-weight: 600; }
    .code-block { position: relative; margin: 24px 0; }
    code {
      display: block;
      background: #0d172a;
      border: 1px solid #ded9cd;
      padding: 20px;
      padding-right: 96px;
      font-family: 'IBM Plex Mono', ui-monospace, monospace;
      font-size: 13px;
      line-height: 1.8;
      color: #e6e9ef;
      white-space: pre;
      overflow-x: auto;
    }
    .copy-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: #f5c800;
      border: 1px solid #f5c800;
      color: #0b1f44;
      font-family: 'IBM Plex Sans', Arial, sans-serif;
      font-size: 13px;
      font-weight: 600;
      padding: 8px 14px;
      min-height: 36px;
      cursor: pointer;
      transition: background 140ms ease, border-color 140ms ease;
    }
    .copy-btn:hover { background: #ffe566; border-color: #d4a800; }
    .copy-btn.copied { background: #ffffff; border-color: #168253; color: #168253; }
    .docs { border-top: 1px solid #ded9cd; padding-top: 24px; margin-top: 24px; }
    .docs p { margin-bottom: 12px; }
    .docs a {
      display: inline-block;
      color: #175cd3;
      text-decoration: none;
      font-weight: 500;
      text-underline-offset: 3px;
      margin-bottom: 8px;
    }
    .docs a:hover { text-decoration: underline; }
    .key { color: #ffe566; }
    .str { color: #9ad9b8; }
    .bool { color: #8fc0ff; }
    .pun { color: #9aa0ab; }
  </style>
</head>
<body>
  <main class="card">
    <p class="label">/_tools/site-audit</p>
    <h1>Tool not enabled</h1>
    <p>Site Audit is not enabled for <strong>${subdomain}.is-pinoy.dev</strong>.</p>
    <p>Add the following to your subdomain JSON to enable it:</p>
    <div class="code-block">
      <code><span class="pun">{</span>
  <span class="key">"features"</span><span class="pun">: {</span>
    <span class="key">"tools"</span><span class="pun">: {</span>
      <span class="key">"site-audit"</span><span class="pun">:</span> <span class="bool">true</span>
    <span class="pun">}</span>
  <span class="pun">}</span>
<span class="pun">}</span></code>
      <button class="copy-btn" onclick="
        navigator.clipboard.writeText(${JSON.stringify(snippet)}).then(() => {
          this.textContent = 'Copied';
          this.classList.add('copied');
          setTimeout(() => { this.textContent = 'Copy'; this.classList.remove('copied'); }, 2000);
        });
      ">Copy</button>
    </div>
    <div class="docs">
      <p>How to enable a tool for your subdomain:</p>
      <a href="https://docs.is-pinoy.dev/docs/tools/site-audit" target="_blank" rel="noopener">
        Site Audit setup guide — docs.is-pinoy.dev
      </a><br>
      <a href="https://github.com/is-pinoy-dev/domains/tree/main/subdomains/${subdomain}.json" target="_blank" rel="noopener">
        Edit ${subdomain}.json on GitHub
      </a>
    </div>
  </main>
</body>
</html>`

  return new Response(html, {
    status: 403,
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  })
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url)
    const hostParts = url.hostname.split(".")

    // For subdomains (e.g. juan.is-pinoy.dev), check feature flag.
    // Apex domain (is-pinoy.dev) is always allowed.
    console.log(
      `[site-audit] request method=${request.method} host=${url.hostname} path=${url.pathname}`
    )

    if (hostParts.length > 2) {
      const subdomain = hostParts.slice(0, hostParts.length - 2).join(".")
      const enabled = await isSiteAuditEnabled(subdomain, ctx)
      if (!enabled) {
        console.warn(
          `[site-audit] blocked subdomain=${subdomain} reason=not-enabled`
        )
        return notEnabledResponse(subdomain)
      }
    }

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
        "[site-audit] React Router threw:",
        err instanceof Error ? err.stack : String(err)
      )
      return new Response("Internal Server Error", { status: 500 })
    }
  },
} satisfies ExportedHandler<Env>
