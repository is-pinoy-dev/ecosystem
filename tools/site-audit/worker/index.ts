import { createRequestHandler } from "@react-router/cloudflare";
// @ts-ignore - build/server is generated at compile time and won't exist during typecheck
import * as build from "../build/server";

const handler = createRequestHandler({ build });

export interface Env {}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handler({
      request: request as unknown as EventContext<Env, string, Record<string, unknown>>["request"],
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
