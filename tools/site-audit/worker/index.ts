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

export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
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
