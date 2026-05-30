/// <reference types="@cloudflare/workers-types" />
import { describe, it, expect } from "vitest";
import { upsertStatus } from "../db";
import type { SubdomainCheck } from "../types";

function makeDb() {
  const store = new Map<string, Record<string, string>>();

  return {
    prepare(_sql: string) {
      return {
        bind(...args: unknown[]) {
          return {
            async first<T>(): Promise<T | null> {
              const subdomain = args[0] as string;
              return (store.get(subdomain) ?? null) as T | null;
            },
            async run(): Promise<void> {
              const [
                subdomain,
                dns_status,
                http_status,
                overall,
                since,
                last_checked,
                ssl_status,
                ssl_expires_at,
                ssl_issuer,
                ssl_checked_at,
              ] = args as (string | null)[];
              store.set(subdomain as string, {
                subdomain: subdomain as string,
                dns_status: dns_status as string,
                http_status: http_status as string,
                overall: overall as string,
                since: since as string,
                last_checked: last_checked as string,
                ssl_status: ssl_status as string,
                ssl_expires_at: ssl_expires_at as string,
                ssl_issuer: ssl_issuer as string,
                ssl_checked_at: ssl_checked_at as string,
              });
            },
          };
        },
      };
    },
    _store: store,
  } as unknown as D1Database & { _store: Map<string, Record<string, string>> };
}

const BASE: SubdomainCheck = {
  subdomain: "juan",
  dns_status: "live",
  http_status: "up",
  overall: "operational",
  ssl_status: "valid",
  ssl_expires_at: "2026-08-28T23:59:59.000Z",
  ssl_issuer: "Let's Encrypt",
  ssl_checked_at: "2026-05-30T00:00:00.000Z",
  last_checked: "2026-05-30T00:00:00.000Z",
};

describe("upsertStatus", () => {
  it("sets since = last_checked on first insert", async () => {
    const db = makeDb();
    await upsertStatus(db, BASE);

    const row = db._store.get("juan")!;
    expect(row.since).toBe("2026-05-30T00:00:00.000Z");
    expect(row.overall).toBe("operational");
  });

  it("updates since when overall status changes", async () => {
    const db = makeDb();
    await upsertStatus(db, {
      ...BASE,
      overall: "propagating",
      dns_status: "propagating",
      http_status: "unchecked",
      last_checked: "2026-05-30T00:00:00.000Z",
    });

    await upsertStatus(db, {
      ...BASE,
      last_checked: "2026-05-30T00:05:00.000Z",
    });

    const row = db._store.get("juan")!;
    expect(row.overall).toBe("operational");
    expect(row.since).toBe("2026-05-30T00:05:00.000Z");
  });

  it("preserves since when overall status is unchanged", async () => {
    const db = makeDb();
    await upsertStatus(db, BASE);

    await upsertStatus(db, {
      ...BASE,
      last_checked: "2026-05-30T00:05:00.000Z",
    });

    const row = db._store.get("juan")!;
    expect(row.since).toBe("2026-05-30T00:00:00.000Z");
    expect(row.last_checked).toBe("2026-05-30T00:05:00.000Z");
  });

  it("persists SSL columns", async () => {
    const db = makeDb();
    await upsertStatus(db, BASE);

    const row = db._store.get("juan")!;
    expect(row.ssl_status).toBe("valid");
    expect(row.ssl_expires_at).toBe("2026-08-28T23:59:59.000Z");
    expect(row.ssl_issuer).toBe("Let's Encrypt");
    expect(row.ssl_checked_at).toBe("2026-05-30T00:00:00.000Z");
  });
});
