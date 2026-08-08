import { describe, it, expect, vi } from "vitest";
import { latestStoredDate, persistSnapshots } from "../db";
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

  return { db, batch };
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

  it("batches 1 clear + 1 total row + N country rows per subdomain", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 30 },
      { host: "juan.is-pinoy.dev", country: "US", requests: 12 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    expect(batch).toHaveBeenCalledOnce();
    const calls = batch.mock.calls[0][0] as MockStmt[];
    // 1 clear + 1 total + 2 country rows = 4
    expect(calls).toHaveLength(4);
  });

  // INSERT OR REPLACE only touches the keys it is handed, so without the clear
  // a re-collected day that no longer reports a country keeps that country's
  // old row — and the breakdown then exceeds the total it sits under.
  it("clears a subdomain's country rows for the date before inserting", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 30 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    const calls = batch.mock.calls[0][0] as MockStmt[];
    const clear = calls.find((s) => s.sql.startsWith("DELETE"))!;
    expect(clear.sql).toBe(
      "DELETE FROM visits_daily_by_country WHERE subdomain = ? AND date = ?"
    );
    expect(clear.bindings).toEqual(["juan", "2026-05-28"]);
  });

  // D1 runs a batch in order, so a clear placed after its inserts would wipe
  // the very rows it was meant to make room for.
  it("orders every clear before every insert", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 30 },
      { host: "maria.is-pinoy.dev", country: "US", requests: 12 },
    ];
    await persistSnapshots(db, ["juan", "maria"], rows, "2026-05-28");
    const calls = batch.mock.calls[0][0] as MockStmt[];
    const clearAt = calls.flatMap((s, i) =>
      s.sql.startsWith("DELETE") ? [i] : []
    );
    const insertAt = calls.flatMap((s, i) =>
      s.sql.startsWith("INSERT") ? [i] : []
    );
    expect(clearAt).toHaveLength(2);
    expect(Math.max(...clearAt)).toBeLessThan(Math.min(...insertAt));
  });

  // Only the pairs being written are cleared. Wiping the whole date would also
  // drop a subdomain missing from a truncated response — unrecoverable, where a
  // stale row is not.
  it("does not clear subdomains absent from this response", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 30 },
    ];
    await persistSnapshots(db, ["juan", "maria"], rows, "2026-05-28");
    const calls = batch.mock.calls[0][0] as MockStmt[];
    const clears = calls.filter((s) => s.sql.startsWith("DELETE"));
    expect(clears).toHaveLength(1);
    expect(clears[0].bindings).toEqual(["juan", "2026-05-28"]);
  });

  it("computes correct total across countries", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 30 },
      { host: "juan.is-pinoy.dev", country: "US", requests: 12 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    const calls = batch.mock.calls[0][0] as MockStmt[];
    const totalStmt = calls.find(
      (s) =>
        s.sql.startsWith("INSERT") &&
        s.sql.includes("visits_daily") &&
        !s.sql.includes("by_country")
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
    // 1 clear + 1 total + 1 country = 3 (only juan)
    expect(calls).toHaveLength(3);
  });

  it("uses correct INSERT OR REPLACE SQL for both tables", async () => {
    const { db, batch } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 10 },
    ];
    await persistSnapshots(db, ["juan"], rows, "2026-05-28");
    const calls = batch.mock.calls[0][0] as MockStmt[];
    // Match on INSERT explicitly: the clear also names visits_daily_by_country.
    const inserts = calls.filter((s) => s.sql.startsWith("INSERT"));
    const totalStmt = inserts.find((s) => !s.sql.includes("by_country"))!;
    const countryStmt = inserts.find((s) => s.sql.includes("by_country"))!;
    expect(totalStmt.sql).toBe(
      "INSERT OR REPLACE INTO visits_daily (subdomain, date, visits) VALUES (?, ?, ?)"
    );
    expect(countryStmt.sql).toBe(
      "INSERT OR REPLACE INTO visits_daily_by_country (subdomain, date, country, visits) VALUES (?, ?, ?, ?)"
    );
  });
});

function makeFirstMock(row: { date: string | null } | null) {
  const first = vi.fn().mockResolvedValue(row);
  const db = {
    prepare: (sql: string) => ({ sql, first }),
  } as unknown as D1Database;
  return { db, first };
}

describe("latestStoredDate", () => {
  it("returns the stored maximum", async () => {
    const { db } = makeFirstMock({ date: "2026-08-05" });
    await expect(latestStoredDate(db)).resolves.toBe("2026-08-05");
  });

  // An empty table answers MAX(date) with one row whose column is NULL, not
  // with no rows at all — both have to read as "nothing collected yet".
  it("returns null when the column is NULL", async () => {
    const { db } = makeFirstMock({ date: null });
    await expect(latestStoredDate(db)).resolves.toBeNull();
  });

  it("returns null when there is no row", async () => {
    const { db } = makeFirstMock(null);
    await expect(latestStoredDate(db)).resolves.toBeNull();
  });
});

describe("persistSnapshots return value", () => {
  // "Collected N/M days" counted requests survived, not rows stored. The caller
  // needs a number that means data actually landed.
  it("returns the number of subdomain-days written", async () => {
    const { db } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "juan.is-pinoy.dev", country: "PH", requests: 30 },
      { host: "juan.is-pinoy.dev", country: "US", requests: 12 },
      { host: "maria.is-pinoy.dev", country: "PH", requests: 5 },
    ];
    await expect(
      persistSnapshots(db, ["juan", "maria"], rows, "2026-05-28")
    ).resolves.toBe(2);
  });

  it("returns 0 when the response held no collectable hostname", async () => {
    const { db } = makeD1Mock();
    const rows: AnalyticsRow[] = [
      { host: "is-pinoy.dev", country: "PH", requests: 5 },
      { host: "someone-else.is-pinoy.dev", country: "PH", requests: 5 },
    ];
    await expect(
      persistSnapshots(db, ["juan"], rows, "2026-05-28")
    ).resolves.toBe(0);
  });

  it("returns 0 for an empty response", async () => {
    const { db } = makeD1Mock();
    await expect(persistSnapshots(db, ["juan"], [], "2026-05-28")).resolves.toBe(
      0
    );
  });
});
