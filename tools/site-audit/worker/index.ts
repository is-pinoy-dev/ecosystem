import { createRequestHandler } from "@react-router/cloudflare";
// @ts-ignore - build/server is generated at compile time and won't exist during typecheck
import * as build from "../build/server";

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

const PREFIX = "/_tools/site-audit";
const DOMAINS_RAW_BASE =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains";
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
      const enabled = data.features?.tools?.["site-audit"] === true;
      console.log(`[site-audit] feature check subdomain=${subdomain} source=cache enabled=${enabled}`);
      return enabled;
    }
  }

  const fetchUrl = `${DOMAINS_RAW_BASE}/${subdomain}.json`;
  console.log(`[site-audit] fetching config subdomain=${subdomain} url=${fetchUrl}`);
  const res = await fetch(fetchUrl);
  if (!res.ok) {
    console.warn(`[site-audit] config fetch failed subdomain=${subdomain} status=${res.status}`);
    return false;
  }

  const data = await res.json<{ features?: { tools?: { "site-audit"?: boolean } } }>();
  const enabled = data.features?.tools?.["site-audit"] === true;
  console.log(`[site-audit] feature check subdomain=${subdomain} source=fetch enabled=${enabled}`);

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

  return enabled;
}

function notEnabledResponse(subdomain: string): Response {
  const snippet = JSON.stringify({ features: { tools: { "site-audit": true } } }, null, 2);
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
      max-width: 540px;
      width: 100%;
    }
    .label { font-size: 9px; color: #F5C800; margin-bottom: 1.5rem; }
    h1 { font-size: 11px; margin-bottom: 1rem; line-height: 1.8; }
    p { font-size: 8px; color: #888; line-height: 2; margin-bottom: 1.5rem; }
    .code-block {
      position: relative;
      margin-bottom: 1.5rem;
    }
    code {
      display: block;
      background: #111;
      border: 1px solid #333;
      padding: 1rem;
      padding-right: 5rem;
      font-size: 11px;
      line-height: 1.8;
      color: #aaa;
      white-space: pre;
      font-family: monospace;
    }
    .copy-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #1e1e1e;
      border: 1px solid #444;
      color: #f5f5f5;
      font-family: 'Press Start 2P', monospace;
      font-size: 7px;
      padding: 0.4rem 0.6rem;
      cursor: pointer;
      line-height: 1;
    }
    .copy-btn:hover { background: #2a2a2a; border-color: #F5C800; color: #F5C800; }
    .copy-btn.copied { color: #4ade80; border-color: #4ade80; }
    .docs {
      border-top: 1px solid #222;
      padding-top: 1.5rem;
    }
    .docs p { margin-bottom: 0.75rem; }
    .docs a {
      color: #7ec8e3;
      text-decoration: none;
      font-size: 8px;
    }
    .docs a:hover { text-decoration: underline; color: #F5C800; }
    .key { color: #F5C800; }
    .str { color: #4ade80; }
    .bool { color: #7ec8e3; }
    .pun { color: #aaa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="label">/_tools/site-audit</div>
    <h1>TOOL NOT ENABLED</h1>
    <p>Site Audit is not enabled for <strong style="color:#f5f5f5">${subdomain}.is-pinoy.dev</strong>.</p>
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
          this.textContent = 'COPIED!';
          this.classList.add('copied');
          setTimeout(() => { this.textContent = 'COPY'; this.classList.remove('copied'); }, 2000);
        });
      ">COPY</button>
    </div>
    <div class="docs">
      <p>How to enable a tool for your subdomain:</p>
      <a href="https://docs.is-pinoy.dev/docs/tools/site-audit" target="_blank" rel="noopener">
        → docs.is-pinoy.dev — Site Audit setup guide
      </a><br><br>
      <a href="https://github.com/is-pinoy-dev/domains/tree/main/subdomains/${subdomain}.json" target="_blank" rel="noopener">
        → Edit ${subdomain}.json on GitHub
      </a>
    </div>
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
    console.log(`[site-audit] request method=${request.method} host=${url.hostname} path=${url.pathname}`);

    if (hostParts.length > 2) {
      const subdomain = hostParts.slice(0, hostParts.length - 2).join(".");
      const enabled = await isSiteAuditEnabled(subdomain, ctx);
      if (!enabled) {
        console.warn(`[site-audit] blocked subdomain=${subdomain} reason=not-enabled`);
        return notEnabledResponse(subdomain);
      }
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
      console.error("[site-audit] React Router threw:", err instanceof Error ? err.stack : String(err));
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
