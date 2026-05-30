import type { D1Database } from "@cloudflare/workers-types";

declare module "react-router" {
  interface AppLoadContext {
    cloudflare: {
      env: {
        STATUS_DB: D1Database;
        ASSETS: unknown;
      };
      ctx: { waitUntil(promise: Promise<unknown>): void };
    };
  }
}
