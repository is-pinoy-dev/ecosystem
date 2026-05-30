import { createRequestHandler } from "@react-router/cloudflare";
// @ts-ignore - build/server is generated at compile time, absent during typecheck
import * as build from "../build/server";

import { fetchSubdomains } from "./github";
import { checkDns, checkHttp, deriveOverall } from "./checker";
import { upsertStatus } from "./db";

export interface Env {
  STATUS_DB: D1Database;
  ASSETS: Fetcher;
}

const handleRequest = createRequestHandler({
  build,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getLoadContext: ({ context }: any) => ({
    cloudflare: {
      env: context.cloudflare.env,
      ctx: context.cloudflare.ctx,
    },
  }),
});

async function runChecks(env: Env): Promise<void> {
  const subdomains = await fetchSubdomains();
  if (subdomains.length === 0) {
    throw new Error(
      "Empty subdomain list from GitHub — aborting to avoid data loss"
    );
  }

  const now = new Date().toISOString();

  const results = await Promise.allSettled(
    subdomains.map(async (subdomain) => {
      const fqdn = `${subdomain}.is-pinoy.dev`;
      const dns = await checkDns(fqdn);
      const http =
        dns === "live" ? await checkHttp(fqdn) : ("unchecked" as const);
      const overall = deriveOverall(dns, http);
      await upsertStatus(env.STATUS_DB, {
        subdomain,
        dns_status: dns,
        http_status: http,
        overall,
        last_checked: now,
      });
    })
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Subdomain check failed:", result.reason);
    }
  }
}

export default {
  async scheduled(
    _event: ScheduledController,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    await runChecks(env);
  },

  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/statuses" && request.method === "GET") {
      const overall = url.searchParams.get("overall");
      const query = overall
        ? "SELECT * FROM subdomain_status WHERE overall = ? ORDER BY subdomain ASC"
        : "SELECT * FROM subdomain_status ORDER BY subdomain ASC";
      const { results } = overall
        ? await env.STATUS_DB.prepare(query).bind(overall).all()
        : await env.STATUS_DB.prepare(query).all();
      return Response.json(results, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }

    if (url.pathname === "/api/refresh" && request.method === "POST") {
      try {
        const COOLDOWN_MS = 2 * 60 * 1000;
        const recent = await env.STATUS_DB.prepare(
          "SELECT last_checked FROM subdomain_status ORDER BY last_checked DESC LIMIT 1"
        ).first<{ last_checked: string }>();

        if (recent) {
          const age = Date.now() - new Date(recent.last_checked).getTime();
          if (age < COOLDOWN_MS) {
            const retryAfter = Math.ceil((COOLDOWN_MS - age) / 1000);
            return Response.json(
              { ok: false, error: "Rate limited", retryAfter },
              { status: 429, headers: { "Retry-After": String(retryAfter) } }
            );
          }
        }

        await runChecks(env);
        return Response.json({ ok: true });
      } catch (err) {
        return Response.json(
          { ok: false, error: err instanceof Error ? err.message : String(err) },
          { status: 500 }
        );
      }
    }

    if (env.ASSETS) {
      try {
        const assetResponse = await env.ASSETS.fetch(
          new Request(request.url, request)
        );
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
      console.error(
        "[status] React Router threw:",
        err instanceof Error ? err.stack : String(err)
      );
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
