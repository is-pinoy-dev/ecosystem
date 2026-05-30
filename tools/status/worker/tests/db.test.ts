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
              const [subdomain, dns_status, http_status, overall, since, last_checked] =
                args as string[];
              store.set(subdomain, {
                subdomain,
                dns_status,
                http_status,
                overall,
                since,
                last_checked,
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
});
