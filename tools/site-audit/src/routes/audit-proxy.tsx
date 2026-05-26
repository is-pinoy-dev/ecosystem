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

  if (!import.meta.env.DEV) {
    const hostname = parsedTarget.hostname.replace(/^\[|\]$/g, "");
    if (BLOCKED_HOSTNAME_RE.test(hostname)) {
      return new Response("Private and loopback addresses are not allowed", { status: 400 });
    }
  }

  try {
    const response = await fetch(parsedTarget.toString(), {
      headers: { "User-Agent": "is-pinoy-dev-site-audit/1.0" },
      signal: AbortSignal.timeout(10000),
    });

    const buffer = await response.arrayBuffer();
    const slice = buffer.byteLength > MAX_BYTES ? buffer.slice(0, MAX_BYTES) : buffer;
    const html = new TextDecoder().decode(slice);

    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new Response("Failed to fetch target URL", { status: 502 });
  }
}
