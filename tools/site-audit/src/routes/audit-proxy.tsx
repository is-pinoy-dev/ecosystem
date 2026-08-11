import type { Route } from "./+types/audit-proxy";

const BLOCKED_HOSTNAME_RE =
  /^(localhost|0\.0\.0\.0|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+|::1|\[::1\])$/i;

const MAX_BYTES = 1_000_000;

export async function loader({ request }: Route.LoaderArgs) {
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
    const response = await fetch(parsedTarget.toString(), {
      headers: {
        "User-Agent": "is-pinoy-dev-site-audit/1.0",
        // Origins that content-negotiate will hand a bare fetch JSON or an
        // RSC payload. We are auditing the document a crawler would see.
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
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
        // from — not necessarily what was asked for.
        finalUrl: response.url || parsedTarget.toString(),
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch {
    return new Response("Failed to fetch target URL", { status: 502 });
  }
}
