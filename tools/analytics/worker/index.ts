export interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

function isNavigationRequest(request: Request): boolean {
  return (
    request.headers.get("Sec-Fetch-Mode") === "navigate" &&
    request.headers.get("Sec-Fetch-Dest") === "document"
  );
}

function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split(".");
  // Only subdomains (e.g. juan.is-pinoy.dev) — skip apex
  if (parts.length <= 2) return null;
  return parts.slice(0, parts.length - 2).join(".");
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (isNavigationRequest(request)) {
      const url = new URL(request.url);
      const subdomain = extractSubdomain(url.hostname);
      if (subdomain && !url.pathname.startsWith("/_tools/")) {
        const country = (request.cf?.country as string | undefined) ?? "XX";
        env.ANALYTICS.writeDataPoint({
          indexes: [subdomain],
          blobs: [country],
        });
      }
    }
    return fetch(request);
  },
} satisfies ExportedHandler<Env>;
