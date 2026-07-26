import { describe, expect, it } from "vitest"

import { manualRefreshPolicy } from "./manual-refresh"

const NOW = new Date("2026-07-26T12:00:00.000Z")

describe("manual preview refresh policy", () => {
  it("allows the portfolio owner case-insensitively", () => {
    expect(
      manualRefreshPolicy({
        actorLogin: "JuanDelaCruz",
        ownerGithub: "juandelacruz",
        screenshotRequestedAt: null,
        now: NOW,
        cooldownHours: 24,
      })
    ).toEqual({ allowed: true })
  })

  it("rejects a different authenticated user", () => {
    expect(
      manualRefreshPolicy({
        actorLogin: "attacker",
        ownerGithub: "juandelacruz",
        screenshotRequestedAt: null,
        now: NOW,
        cooldownHours: 24,
      })
    ).toEqual({ allowed: false, reason: "unauthorized" })
  })

  it("permits an explicitly authorized administrator", () => {
    expect(
      manualRefreshPolicy({
        actorLogin: "maintainer",
        ownerGithub: "juandelacruz",
        isAdmin: true,
        screenshotRequestedAt: null,
        now: NOW,
        cooldownHours: 24,
      })
    ).toEqual({ allowed: true })
  })

  it("enforces the 24-hour cooldown", () => {
    expect(
      manualRefreshPolicy({
        actorLogin: "juandelacruz",
        ownerGithub: "juandelacruz",
        screenshotRequestedAt: new Date("2026-07-26T11:00:00.000Z"),
        now: NOW,
        cooldownHours: 24,
      })
    ).toEqual({
      allowed: false,
      reason: "cooldown",
      retryAfterSeconds: 23 * 60 * 60,
    })
  })
})
