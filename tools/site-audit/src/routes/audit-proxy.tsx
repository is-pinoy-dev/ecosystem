import type { Route } from "./+types/audit-proxy";

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

  try {
    const response = await fetch(parsedTarget.toString(), {
      headers: { "User-Agent": "is-pinoy-dev-site-audit/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    const html = await response.text();
    return new Response(html, {
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new Response("Failed to fetch target URL", { status: 502 });
  }
}
