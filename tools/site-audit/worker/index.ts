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
    // Strip the sub-path prefix when fetching static assets so that
    // /_tools/site-audit/assets/main.js resolves to build/client/assets/main.js
    const url = new URL(request.url);
    if (url.pathname.startsWith(PREFIX)) {
      url.pathname = url.pathname.slice(PREFIX.length) || "/";
    }
    const assetResponse = await env.ASSETS.fetch(new Request(url.toString(), request));
    if (assetResponse.status !== 404) return assetResponse;

    // Pass the original request URL to React Router so basename stripping works
    return handler({
      request: request as Request & { cf?: IncomingRequestCfProperties },
      functionPath: "",
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException.bind(ctx),
      next: () => Promise.resolve(new Response("Not Found", { status: 404 })),
      env,
      params: {},
      data: {},
    });
  },
} satisfies ExportedHandler<Env>;
