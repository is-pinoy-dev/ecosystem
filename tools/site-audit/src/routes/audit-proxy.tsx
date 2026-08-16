import type { Route } from "./+types/audit-proxy";

const BLOCKED_HOSTNAME_RE =
  /^(localhost|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|::1|\[::1\])$/i;

const MAX_BYTES = 1_000_000;

/** Mirrors tools/portfolio-proxy's [vars] plus its secret. */
interface PortfolioEnv {
  ROOT_DOMAIN?: string
  RENDERER_HOST?: string
  PORTFOLIO_PROXY_SECRET?: string
}

const LABEL_PATTERN = /^[a-z0-9-]{1,63}$/

/**
 * Where to actually fetch `target` from.
 *
 * A hosted portfolio is only reachable at its own hostname because a Workers
 * route rewrites the request onto the renderer — and a `fetch()` from inside a
 * Worker to its own zone does not re-run that zone's routes. Cloudflare skips
 * them to keep Workers from recursing, so this subrequest would bypass
 * portfolio-proxy, reach the origin still carrying the portfolio's hostname,
 * and fail the TLS handshake against a certificate that does not cover it —
 * HTTP 525, for a page that serves perfectly to a browser.
 *
 * So for a subdomain of our own zone we do what portfolio-proxy does: address
 * the renderer directly and carry the label in a header, authenticated by the
 * shared secret. Anything else — the apex, an external site — is fetched as
 * asked. Unconfigured, this falls back to the plain fetch rather than failing.
 */
function upstreamFor(
  target: URL,
  env: PortfolioEnv,
): { url: URL; headers: Record<string, string>; rewritten: boolean } {
  const plain = { url: target, headers: {}, rewritten: false }
  const { ROOT_DOMAIN, RENDERER_HOST, PORTFOLIO_PROXY_SECRET } = env
  if (!ROOT_DOMAIN || !RENDERER_HOST || !PORTFOLIO_PROXY_SECRET) return plain

  const suffix = `.${ROOT_DOMAIN}`
  if (!target.hostname.endsWith(suffix)) return plain
  const label = target.hostname.slice(0, -suffix.length)
  // Nested labels and the renderer host itself are not portfolios.
  if (!LABEL_PATTERN.test(label) || target.hostname === RENDERER_HOST) {
    return plain
  }

  const url = new URL(target)
  url.hostname = RENDERER_HOST
  return {
    url,
    headers: {
      "x-portfolio-subdomain": label,
      "x-portfolio-proxy-secret": PORTFOLIO_PROXY_SECRET,
    },
    rewritten: true,
  }
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return new Response("Missing url parameter", { status: 400 });
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(target);
  } catch {
    return new Response("Invalid url parameter", { status: 400 });
  }

  if (!["http:", "https:"].includes(parsedTarget.protocol)) {
    return new Response("Only http and https URLs are allowed", { status: 400 });
  }

  if (import.meta.env.MODE !== "development") {
    const hostname = parsedTarget.hostname.replace(/^\[|\]$/g, "");
    if (BLOCKED_HOSTNAME_RE.test(hostname)) {
      return new Response("Private and loopback addresses are not allowed", { status: 400 });
    }
  }

  try {
    const env = ((context as { cloudflare?: { env?: PortfolioEnv } })?.cloudflare
      ?.env ?? {}) as PortfolioEnv;
    const upstream = upstreamFor(parsedTarget, env);

    const response = await fetch(upstream.url.toString(), {
      headers: {
        "User-Agent": "is-pinoy-dev-site-audit/1.0",
        // Origins that content-negotiate will hand a bare fetch JSON or an
        // RSC payload. We are auditing the document a crawler would see.
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        ...upstream.headers,
      },
      signal: AbortSignal.timeout(10000),
    });

    const buffer = await response.arrayBuffer();
    const slice = buffer.byteLength > MAX_BYTES ? buffer.slice(0, MAX_BYTES) : buffer;
    const html = new TextDecoder().decode(slice);

    // The status, the type and the size travel with the body. A 404, an empty
    // response and a JSON error all parse as a valid-but-empty document, and
    // every field then reports "missing" — a page that was never fetched
    // grades as a page with no metadata. Only the caller can tell those apart,
    // and only if we hand it more than the bytes.
    return new Response(
      JSON.stringify({
        html,
        xRobotsTag: response.headers.get("x-robots-tag"),
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        bytes: buffer.byteLength,
        // The renderer's own verdict on how it routed this request — see
        // apps/portfolio/proxy.ts. When a hosted portfolio serves a 404 or an
        // empty body, this header is what says whether the label never
        // arrived, the shared secret didn't match, or the deployment has no
        // secret at all. It is the difference between "your page is missing
        // metadata" and "your page was never rendered".
        portfolioRoute: response.headers.get("x-portfolio-route"),
        // Redirects are followed, so this is where the bytes actually came
        // from — not necessarily what was asked for. When we addressed the
        // renderer on the portfolio's behalf, that rewrite is ours and not a
        // redirect: report the address the page is actually published at, or
        // the caller reads its own indirection as an off-origin hop.
        finalUrl: upstream.rewritten
          ? parsedTarget.toString()
          : response.url || parsedTarget.toString(),
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch {
    return new Response("Failed to fetch target URL", { status: 502 });
  }
}
