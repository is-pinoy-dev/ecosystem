import { describe, it, expect } from "vitest";

import {
  portfolioSchema,
  themeSchema,
  isCommunityTheme,
  BUILTIN_THEMES,
  LAYOUT_TEMPLATES,
  DESIGNER_TEMPLATES,
} from "../domain/index.js";

// A subdomain's `portfolio` block is the only place a community theme is named,
// so these rules are what stand between "the owner picked a theme" and "someone
// else decides what renders on the owner's subdomain". The version-pinning
// tests in particular are the supply-chain boundary, not style preferences.

describe("theme reference", () => {
  it("accepts every built-in theme by name", () => {
    for (const theme of BUILTIN_THEMES) {
      expect(themeSchema.safeParse(theme).success).toBe(true);
    }
  });

  it("accepts a community theme pinned to an exact version", () => {
    const parsed = themeSchema.safeParse({
      id: "@maria-santos/brutal-grid",
      version: "1.2.0",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects version ranges and floating tags", () => {
    // Each of these would let the theme author change what renders on someone
    // else's subdomain without that owner opening a PR.
    for (const version of [
      "^1.2.0",
      "~1.2.0",
      ">=1.0.0",
      "1.x",
      "1.2",
      "latest",
      "main",
      "*",
      "",
    ]) {
      const parsed = themeSchema.safeParse({
        id: "@maria-santos/brutal-grid",
        version,
      });
      expect(parsed.success, `expected "${version}" to be rejected`).toBe(false);
    }
  });

  it("allows prerelease versions but not build metadata", () => {
    const id = "@maria-santos/brutal-grid";
    expect(themeSchema.safeParse({ id, version: "1.0.0-beta.1" }).success).toBe(
      true
    );
    expect(themeSchema.safeParse({ id, version: "1.0.0+build.5" }).success).toBe(
      false
    );
  });

  it("requires the id to name a real GitHub account shape", () => {
    for (const id of [
      "brutal-grid", // no author segment
      "maria/brutal-grid", // missing @
      "@/brutal-grid", // empty author
      "@maria/", // empty name
      "@-maria/brutal-grid", // author cannot lead with a hyphen
      "@maria-/brutal-grid", // ...or trail with one
      "@ma--ria/brutal-grid", // ...or contain consecutive hyphens
      "@maria/Brutal-Grid", // name segment is lowercase
      "@maria/brutal grid",
      "@maria/brutal/grid",
      `@${"a".repeat(40)}/brutal-grid`, // GitHub logins cap at 39
    ]) {
      expect(
        themeSchema.safeParse({ id, version: "1.0.0" }).success,
        `expected "${id}" to be rejected`
      ).toBe(false);
    }
  });

  it("narrows built-in vs community with isCommunityTheme", () => {
    expect(isCommunityTheme("gold-dark")).toBe(false);
    expect(isCommunityTheme(undefined)).toBe(false);
    expect(isCommunityTheme({ id: "@a/b", version: "1.0.0" })).toBe(true);
  });
});

describe("portfolio block", () => {
  it("accepts a layout template with a community theme", () => {
    const parsed = portfolioSchema.safeParse({
      template: "minimal",
      theme: { id: "@maria-santos/brutal-grid", version: "1.2.0" },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a community theme on a designer template", () => {
    // Designer templates ignore `theme`, so honouring this would silently
    // discard a choice the owner made deliberately.
    for (const template of DESIGNER_TEMPLATES) {
      const parsed = portfolioSchema.safeParse({
        template,
        theme: { id: "@maria-santos/brutal-grid", version: "1.2.0" },
      });
      expect(parsed.success, `expected ${template} to be rejected`).toBe(false);
    }
  });

  it("still tolerates a built-in theme on a designer template", () => {
    // Long-standing behaviour: redundant but harmless, and existing subdomain
    // files in the domains repo rely on it parsing.
    for (const template of DESIGNER_TEMPLATES) {
      expect(
        portfolioSchema.safeParse({ template, theme: "gold-dark" }).success
      ).toBe(true);
    }
  });

  it("accepts every layout template with a built-in theme", () => {
    for (const template of LAYOUT_TEMPLATES) {
      expect(
        portfolioSchema.safeParse({ template, theme: "matrix" }).success
      ).toBe(true);
    }
  });

  it("leaves existing portfolio blocks valid", () => {
    // Backwards compatibility: every shape already merged into the domains repo
    // must keep parsing after the theme field became a union.
    expect(portfolioSchema.safeParse(undefined).success).toBe(true);
    expect(portfolioSchema.safeParse({ template: "terminal" }).success).toBe(
      true
    );
    expect(
      portfolioSchema.safeParse({
        template: "terminal",
        theme: "gold-dark",
        sections: ["about", "projects"],
      }).success
    ).toBe(true);
  });

  it("rejects an unknown template", () => {
    expect(portfolioSchema.safeParse({ template: "nope" }).success).toBe(false);
  });
});
