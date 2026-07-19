import { describe, expect, it } from "vitest"

import {
  reconcile,
  type IncomingDomain,
  type ReconcileStatement,
} from "./reconcile"
import type { SubdomainRow } from "./schema"

const SYNCED_AT = new Date("2026-07-19T10:00:00.000Z")

function existingRow(overrides: Partial<SubdomainRow> = {}): SubdomainRow {
  return {
    name: "juan",
    ownerGithub: "juandelacruz",
    ownerEmail: null,
    records: { CNAME: "juandelacruz.github.io" },
    syncStatus: "synced",
    lastError: null,
    lastSyncedAt: new Date("2026-07-01T00:00:00.000Z"),
    createdAt: new Date("2025-11-02T08:15:00.000Z"),
    updatedAt: new Date("2026-03-19T14:02:00.000Z"),
    ...overrides,
  }
}

function incoming(overrides: Partial<IncomingDomain> = {}): IncomingDomain {
  return {
    subdomain: "juan",
    owner: { github: "juandelacruz" },
    records: { CNAME: "juandelacruz.github.io" },
    status: "synced",
    ...overrides,
  }
}

type OfType<T extends ReconcileStatement["type"]> = Extract<
  ReconcileStatement,
  { type: T }
>

function assertType<T extends ReconcileStatement["type"]>(
  stmt: ReconcileStatement | undefined,
  type: T,
): OfType<T> {
  if (!stmt || stmt.type !== type) {
    throw new Error(`expected ${type} statement, got ${stmt?.type ?? "none"}`)
  }
  return stmt as OfType<T>
}

describe("reconcile", () => {
  it("inserts a brand-new domain and applies sync fields", () => {
    const { statements, counts } = reconcile([], [incoming()], SYNCED_AT)

    expect(counts).toEqual({ inserted: 1, updated: 0, deleted: 0, total: 1 })
    expect(statements).toHaveLength(1)

    const stmt = assertType(statements[0], "insert")
    expect(stmt.values.name).toBe("juan")
    expect(stmt.values.ownerGithub).toBe("juandelacruz")
    expect(stmt.values.ownerEmail).toBeNull()
    expect(stmt.values.records).toEqual({ CNAME: "juandelacruz.github.io" })
    expect(stmt.values.syncStatus).toBe("synced")
    expect(stmt.values.lastError).toBeNull()
    expect(stmt.values.lastSyncedAt).toBe(SYNCED_AT)
    // No git dates supplied → leave createdAt/updatedAt to the column defaults.
    expect(stmt.values.createdAt).toBeUndefined()
    expect(stmt.values.updatedAt).toBeUndefined()
  })

  it("uses git-derived dates on insert when provided", () => {
    const { statements } = reconcile(
      [],
      [
        incoming({
          createdAt: "2025-01-01T00:00:00.000Z",
          updatedAt: "2025-06-01T00:00:00.000Z",
        }),
      ],
      SYNCED_AT,
    )
    const stmt = assertType(statements[0], "insert")
    expect(stmt.values.createdAt).toEqual(new Date("2025-01-01T00:00:00.000Z"))
    expect(stmt.values.updatedAt).toEqual(new Date("2025-06-01T00:00:00.000Z"))
  })

  it("records a failure status with its error message", () => {
    const { statements } = reconcile(
      [],
      [incoming({ status: "failed", error: "boom" })],
      SYNCED_AT,
    )
    const stmt = assertType(statements[0], "insert")
    expect(stmt.values.syncStatus).toBe("failed")
    expect(stmt.values.lastError).toBe("boom")
  })

  it("falls back to a generic error when a failure omits the message", () => {
    const { statements } = reconcile(
      [],
      [incoming({ status: "failed" })],
      SYNCED_AT,
    )
    const stmt = assertType(statements[0], "insert")
    expect(stmt.values.lastError).toBe("unknown error")
  })

  it("refreshes sync fields but does not bump updatedAt on an unchanged resync", () => {
    const { statements, counts } = reconcile(
      [existingRow()],
      [incoming()],
      SYNCED_AT,
    )

    expect(counts).toEqual({ inserted: 0, updated: 0, deleted: 0, total: 1 })
    const stmt = assertType(statements[0], "update")
    expect(stmt.name).toBe("juan")
    expect(stmt.set.syncStatus).toBe("synced")
    expect(stmt.set.lastSyncedAt).toBe(SYNCED_AT)
    expect(stmt.set.updatedAt).toBeUndefined()
    expect(stmt.set.records).toBeUndefined()
  })

  it("bumps updatedAt and content when the record actually changes", () => {
    const { statements, counts } = reconcile(
      [existingRow()],
      [incoming({ records: { CNAME: "new-target.github.io" } })],
      SYNCED_AT,
    )

    expect(counts).toEqual({ inserted: 0, updated: 1, deleted: 0, total: 1 })
    const stmt = assertType(statements[0], "update")
    expect(stmt.set.records).toEqual({ CNAME: "new-target.github.io" })
    expect(stmt.set.updatedAt).toBe(SYNCED_AT)
  })

  it("corrects a drifted createdAt from git dates without counting as an update", () => {
    const { statements, counts } = reconcile(
      [existingRow({ createdAt: new Date("2026-07-18T00:00:00.000Z") })],
      [incoming({ createdAt: "2025-11-02T08:15:00.000Z" })],
      SYNCED_AT,
    )

    expect(counts.updated).toBe(0)
    const stmt = assertType(statements[0], "update")
    expect(stmt.set.createdAt).toEqual(new Date("2025-11-02T08:15:00.000Z"))
  })

  it("deletes rows that are absent from the incoming snapshot", () => {
    const { statements, counts } = reconcile(
      [existingRow(), existingRow({ name: "maria" })],
      [incoming()],
      SYNCED_AT,
    )

    expect(counts).toEqual({ inserted: 0, updated: 0, deleted: 1, total: 1 })
    const del = assertType(
      statements.find((s) => s.type === "delete"),
      "delete",
    )
    expect(del.name).toBe("maria")
  })
})
