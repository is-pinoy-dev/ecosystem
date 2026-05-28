import { describe, it, expect, vi } from "vitest";
import { persistSnapshots } from "../db";
import type { AnalyticsRow } from "../types";

interface MockStmt {
  sql: string;
  bindings: unknown[];
}

function makeD1Mock() {
  const stmts: MockStmt[] = [];
  const batch = vi.fn().mockResolvedValue([]);

  const db = {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => {
        const stmt = { sql, bindings: args };
        stmts.push(stmt);
        return stmt;
      },
    }),
    batch,
  } as unknown as D1Database;

  return { db, stmts, batch };
}

describe("persistSnapshots", () => {
  it("does nothing when rows array is empty", async () => {
    const { db, batch } = makeD1Mock();
    await persistSnapshots(db, ["juan"], [], "2026-05-28");
    expect(batch).not.toHaveBeenCalled();
  });

  it("does nothing when no rows match the subdomain allowlist", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "unknown.is-pinoy.dev", country: "PH", requests: 10 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    expect(batch).not.toHaveBeenCalled();
  });

  it("batches 1 total row + N country rows per subdomain", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 30 },
      { host: "juan.is-pinoy.dev", country: "US", requests: 12 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    expect(batch).toHaveBeenCalledOnce();
    const calls = batch.mock.calls[0][0] as MockStmt[];
    // 1 total + 2 country rows = 3
    expect(calls).toHaveLength(3);
  });

  it("computes correct total across countries", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 30 },
      { host: "juan.is-pinoy.dev", country: "US", requests: 12 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    const calls = batch.mock.calls[0][0] as MockStmt[];
    const totalStmt = calls.find((s) =>
      s.sql.includes("visits_daily") && !s.sql.includes("by_country")
    )!;
    expect(totalStmt.bindings).toEqual(["juan", "2026-05-28", 42]);
  });

  it("skips apex domain and unknown subdomains", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "is-pinoy.dev", country: "PH", requests: 5 },
      { host: "unknown.is-pinoy.dev", country: "PH", requests: 5 },
      { host: "juan.is-pinoy.dev", country: "PH", requests: 20 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    expect(batch).toHaveBeenCalledOnce();
    const calls = batch.mock.calls[0][0] as MockStmt[];
    // 1 total + 1 country = 2 (only juan)
    expect(calls).toHaveLength(2);
  });
});
