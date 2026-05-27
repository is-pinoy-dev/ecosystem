import { createPagesFunctionHandler } from "@react-router/cloudflare";
// @ts-ignore - build/server is generated at compile time and won't exist during typecheck
import * as build from "../build/server";

const handler = createPagesFunctionHandler({ build });

const PREFIX = "/_tools/site-audit";

export interface Env {
  ASSETS: Fetcher;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const originalUrl = request.url;
    console.log("[site-audit] fetch", request.method, originalUrl);

    const url = new URL(request.url);
    if (url.pathname.startsWith(PREFIX)) {
      url.pathname = url.pathname.slice(PREFIX.length) || "/";
    }
    const assetUrl = url.toString();
    console.log("[site-audit] asset lookup", assetUrl);

    const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));
    console.log("[site-audit] asset status", assetResponse.status);
    if (assetResponse.status !== 404) return assetResponse;

    console.log("[site-audit] falling through to React Router");
    const rrResponse = await handler({
      request: request as Request & { cf?: IncomingRequestCfProperties },
      functionPath: "",
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException.bind(ctx),
      next: () => Promise.resolve(new Response("Not Found", { status: 404 })),
      env,
      params: {},
      data: {},
    });
    console.log("[site-audit] React Router response status", rrResponse.status);
    return rrResponse;
  },
} satisfies ExportedHandler<Env>;
