import { describe, expect, it } from "vitest"

import {
  buildToggledFile,
  proxyBranch,
  proxyLockReason,
  proxyPolicy,
  readProxyState,
  readProxyStates,
  setProxied,
  subdomainFromHeadLabel,
  summarizeChanges,
} from "./proxy-record"

function file(records: Record<string, unknown>) {
  return {
    subdomain: "juan",
    owner: { github: "juandelacruz" },
    records,
  }
}

describe("readProxyState", () => {
  it("reads the flag off a single record", () => {
    const state = readProxyState(
      { CNAME: { value: "juan.github.io", proxied: true } },
      "CNAME"
    )
    expect(state).toEqual({
      type: "CNAME",
      proxied: true,
      mixed: false,
      count: 1,
    })
  })

  it("treats an absent flag as unproxied", () => {
    expect(readProxyState({ A: { value: "1.2.3.4" } }, "A")?.proxied).toBe(
      false
    )
  })

  it("treats a bare-string entry as unproxied", () => {
    const state = readProxyState({ CNAME: "juan.github.io" }, "CNAME")
    expect(state).toEqual({
      type: "CNAME",
      proxied: false,
      mixed: false,
      count: 1,
    })
  })

  it("is proxied only when every entry in an array is", () => {
    const records = {
      A: [
        { value: "1.2.3.4", proxied: true },
        { value: "5.6.7.8", proxied: true },
      ],
    }
    expect(readProxyState(records, "A")).toEqual({
      type: "A",
      proxied: true,
      mixed: false,
      count: 2,
    })
  })

  it("flags an array whose entries disagree as mixed", () => {
    const records = {
      A: [
        { value: "1.2.3.4", proxied: true },
        { value: "5.6.7.8", proxied: false },
      ],
    }
    expect(readProxyState(records, "A")).toEqual({
      type: "A",
      proxied: false,
      mixed: true,
      count: 2,
    })
  })

  it("returns null for types Cloudflare cannot proxy", () => {
    const records = { TXT: { value: "vc-domain-verify=x", provider: "vercel" } }
    expect(readProxyState(records, "TXT")).toBeNull()
  })

  it("returns null for a type the record does not have", () => {
    expect(readProxyState({ CNAME: { value: "x.io" } }, "A")).toBeNull()
  })

  it("lists only the proxyable types present", () => {
    const records = {
      CNAME: { value: "juan.github.io" },
      TXT: { value: "vc-domain-verify=x", provider: "vercel" },
    }
    expect(readProxyStates(records).map((s) => s.type)).toEqual(["CNAME"])
  })
})

describe("setProxied", () => {
  it("sets the flag without mutating the input", () => {
    const records = { CNAME: { value: "juan.github.io", proxied: false } }
    const updated = setProxied(records, "CNAME", true)

    expect(updated.CNAME).toEqual({ value: "juan.github.io", proxied: true })
    expect(records.CNAME.proxied).toBe(false)
  })

  it("preserves other fields on the entry", () => {
    const records = { A: { value: "1.2.3.4", ttl: 300 } }
    expect(setProxied(records, "A", true).A).toEqual({
      value: "1.2.3.4",
      ttl: 300,
      proxied: true,
    })
  })

  it("promotes a bare string to an object so the result matches the schema", () => {
    expect(
      setProxied({ CNAME: "juan.github.io" }, "CNAME", true).CNAME
    ).toEqual({
      value: "juan.github.io",
      proxied: true,
    })
  })

  it("brings every entry of an array into line", () => {
    const records = {
      A: [
        { value: "1.2.3.4", proxied: true },
        { value: "5.6.7.8", proxied: false },
      ],
    }
    expect(setProxied(records, "A", true).A).toEqual([
      { value: "1.2.3.4", proxied: true },
      { value: "5.6.7.8", proxied: true },
    ])
  })

  it("leaves other record types untouched", () => {
    const records = {
      CNAME: { value: "juan.github.io" },
      TXT: { value: "vc-domain-verify=x", provider: "vercel" },
    }
    expect(setProxied(records, "CNAME", true).TXT).toEqual(records.TXT)
  })
})

describe("proxyPolicy / proxyLockReason", () => {
  it("pins a hosted portfolio's CNAME on", () => {
    const records = {
      CNAME: { value: "portfolio.is-pinoy.dev", proxied: true },
    }
    expect(proxyPolicy(records, "CNAME").pinnedTo).toBe(true)
    expect(proxyLockReason(records, "CNAME")).toMatch(/portfolio/i)
  })

  it("matches the portfolio target case-insensitively and with a trailing dot", () => {
    const records = {
      CNAME: { value: "Portfolio.Is-Pinoy.Dev.", proxied: true },
    }
    expect(proxyLockReason(records, "CNAME")).not.toBeNull()
  })

  it("pins GitHub Pages off — it needs DNS-only for its certificate", () => {
    const records = { CNAME: { value: "juan.github.io", proxied: false } }
    expect(proxyPolicy(records, "CNAME").pinnedTo).toBe(false)
    expect(proxyLockReason(records, "CNAME")).toMatch(/GitHub Pages/)
  })

  it("pins Cloudflare Pages off — proxying it hits Error 1014", () => {
    const records = { CNAME: { value: "app.pages.dev", proxied: false } }
    expect(proxyPolicy(records, "CNAME").pinnedTo).toBe(false)
    expect(proxyLockReason(records, "CNAME")).toMatch(/1014/)
  })

  it("stays actionable when a record sits at the wrong value, so it can be fixed", () => {
    // Hand-edited into a broken state: GitHub Pages must not be proxied.
    const records = { CNAME: { value: "juan.github.io", proxied: true } }
    expect(proxyPolicy(records, "CNAME").pinnedTo).toBe(false)
    expect(proxyLockReason(records, "CNAME")).toBeNull()
  })

  it("leaves a host with no proxy constraint free to toggle", () => {
    const records = { CNAME: { value: "juan.example.com", proxied: true } }
    expect(proxyPolicy(records, "CNAME").pinnedTo).toBeNull()
    expect(proxyLockReason(records, "CNAME")).toBeNull()
  })

  it("never constrains an A record — a bare IP identifies no host", () => {
    const records = {
      A: { value: "1.2.3.4" },
      CNAME: { value: "portfolio.is-pinoy.dev" },
    }
    expect(proxyPolicy(records, "A").pinnedTo).toBeNull()
    expect(proxyLockReason(records, "A")).toBeNull()
  })
})

describe("buildToggledFile", () => {
  it("emits schema-valid JSON with a trailing newline", () => {
    const result = buildToggledFile(
      file({ CNAME: { value: "juan.github.io", proxied: false } }),
      [{ kind: "proxy", type: "CNAME", enabled: true }]
    )
    expect(result).not.toHaveProperty("error")
    const content = (result as { content: string }).content
    expect(content.endsWith("\n")).toBe(true)
    expect(JSON.parse(content).records.CNAME.proxied).toBe(true)
  })

  it("preserves the $schema key real record files carry", () => {
    const source = {
      $schema:
        "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/schemas/v1/subdomain.schema.json",
      ...file({ CNAME: { value: "juan.github.io", proxied: true } }),
    }
    const result = buildToggledFile(source, [
      { kind: "proxy", type: "CNAME", enabled: false },
    ])
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.$schema).toBe(source.$schema)
    expect(parsed.records.CNAME.proxied).toBe(false)
  })

  it("preserves unrelated blocks such as features", () => {
    const source = {
      ...file({ A: { value: "1.2.3.4" } }),
      features: { tools: { og: true } },
    }
    const result = buildToggledFile(source, [
      { kind: "proxy", type: "A", enabled: true },
    ])
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.features).toEqual({ tools: { og: true } })
  })

  it("rejects a file with no records block", () => {
    expect(
      buildToggledFile({ subdomain: "juan" }, [
        { kind: "proxy", type: "A", enabled: true },
      ])
    ).toEqual({
      error: "The record file has no records block.",
    })
  })

  it("rejects a record the schema would fail", () => {
    const result = buildToggledFile(file({ A: { value: "not-an-ip" } }), [
      { kind: "proxy", type: "A", enabled: true },
    ])
    expect(result).toHaveProperty("error")
  })

  it("rejects a reserved subdomain the CI check would reject", () => {
    const result = buildToggledFile(
      { ...file({ CNAME: { value: "x.io" } }), subdomain: "www" },
      [{ kind: "proxy", type: "CNAME", enabled: true }]
    )
    expect(result).toHaveProperty("error")
  })

  it("applies edits to several record types in one pass", () => {
    const source = file({
      A: { value: "1.2.3.4", proxied: false },
      CNAME: { value: "juan.github.io", proxied: true },
    })
    const result = buildToggledFile(source, [
      { kind: "proxy", type: "A", enabled: true },
      { kind: "proxy", type: "CNAME", enabled: false },
    ])
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.records.A.proxied).toBe(true)
    expect(parsed.records.CNAME.proxied).toBe(false)
  })

  it("enables a tool, creating the features block when absent", () => {
    const result = buildToggledFile(
      file({ CNAME: { value: "juan.example.com", proxied: true } }),
      [{ kind: "feature", feature: "site-audit", enabled: true }]
    )
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.features).toEqual({ tools: { "site-audit": true } })
  })

  it("applies a proxy flip and a tool flag in one commit", () => {
    const result = buildToggledFile(
      file({ CNAME: { value: "juan.example.com", proxied: false } }),
      [
        { kind: "proxy", type: "CNAME", enabled: true },
        { kind: "feature", feature: "site-audit", enabled: true },
      ]
    )
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.records.CNAME.proxied).toBe(true)
    expect(parsed.features.tools["site-audit"]).toBe(true)
  })

  it("leaves the file without a features block when only the proxy changed", () => {
    const result = buildToggledFile(
      file({ CNAME: { value: "juan.example.com", proxied: false } }),
      [{ kind: "proxy", type: "CNAME", enabled: true }]
    )
    const parsed = JSON.parse((result as { content: string }).content)
    expect("features" in parsed).toBe(false)
  })

  it("rejects an empty batch", () => {
    const result = buildToggledFile(file({ A: { value: "1.2.3.4" } }), [])
    expect(result).toEqual({ error: "No changes to apply." })
  })
})

/**
 * A hosted portfolio record: CNAMEd at the renderer, carrying a style. Its
 * subdomain is the owner's login because the repo's own validation requires
 * exactly that of a record with a portfolio block.
 */
function portfolioFile(portfolio: Record<string, unknown>) {
  return {
    subdomain: "juandelacruz",
    owner: { github: "juandelacruz" },
    records: { CNAME: { value: "portfolio.is-pinoy.dev", proxied: true } },
    portfolio,
  }
}

describe("buildToggledFile — portfolio style", () => {
  it("rewrites the template and palette of a layout", () => {
    const result = buildToggledFile(
      portfolioFile({ template: "terminal", theme: "gold-dark" }),
      [{ kind: "portfolio", template: "minimal", theme: "mono" }]
    )
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.portfolio).toEqual({ template: "minimal", theme: "mono" })
  })

  it("drops the palette when moving to a designer design", () => {
    const result = buildToggledFile(
      portfolioFile({ template: "terminal", theme: "matrix" }),
      [{ kind: "portfolio", template: "noir", theme: "matrix" }]
    )
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.portfolio).toEqual({ template: "noir" })
  })

  it("keeps unrelated portfolio keys such as sections", () => {
    const result = buildToggledFile(
      portfolioFile({
        template: "terminal",
        theme: "gold-dark",
        sections: ["about", "projects"],
      }),
      [{ kind: "portfolio", template: "grid" }]
    )
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.portfolio).toEqual({
      template: "grid",
      sections: ["about", "projects"],
    })
  })

  it("leaves the DNS records untouched", () => {
    const source = portfolioFile({ template: "terminal", theme: "gold-dark" })
    const result = buildToggledFile(source, [
      { kind: "portfolio", template: "bento" },
    ])
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.records).toEqual(source.records)
  })

  it("rejects a style that is already the saved one", () => {
    const result = buildToggledFile(
      portfolioFile({ template: "terminal", theme: "gold-dark" }),
      [{ kind: "portfolio", template: "terminal", theme: "gold-dark" }]
    )
    expect(result).toEqual({ error: "That is already this portfolio's style." })
  })

  it("treats a palette on a designer design as no change at all", () => {
    // `theme` is not written for a designer template, so switching it is a
    // request to rewrite the file with identical contents.
    const result = buildToggledFile(portfolioFile({ template: "noir" }), [
      { kind: "portfolio", template: "noir", theme: "crimson" },
    ])
    expect(result).toEqual({ error: "That is already this portfolio's style." })
  })

  it("rejects a record with no portfolio block", () => {
    const result = buildToggledFile(
      file({ CNAME: { value: "juan.github.io" } }),
      [{ kind: "portfolio", template: "grid" }]
    )
    expect(result).toEqual({
      error: "This subdomain is not a hosted portfolio, so it has no style.",
    })
  })

  it("applies a style change and a tool flag in one commit", () => {
    const result = buildToggledFile(
      portfolioFile({ template: "terminal", theme: "gold-dark" }),
      [
        { kind: "portfolio", template: "solar" },
        { kind: "feature", feature: "site-audit", enabled: true },
      ]
    )
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.portfolio).toEqual({ template: "solar" })
    expect(parsed.features.tools["site-audit"]).toBe(true)
  })
})

describe("summarizeChanges", () => {
  it("describes a lone proxy flip as enabling the proxy", () => {
    const summary = summarizeChanges("juan", [
      { kind: "proxy", type: "CNAME", enabled: true },
    ])
    expect(summary.title).toBe("Enable Cloudflare proxy: juan")
    expect(summary.commitMessage).toBe(
      "chore: enable Cloudflare proxy for juan"
    )
    expect(summary.bullets).toEqual(["- `records.CNAME.proxied` → `true`"])
  })

  it("describes a mixed batch as an update", () => {
    const summary = summarizeChanges("juan", [
      { kind: "proxy", type: "CNAME", enabled: true },
      { kind: "feature", feature: "og", enabled: false },
    ])
    expect(summary.title).toBe("Update platform settings: juan")
  })

  it("titles a style-only batch as a portfolio style change", () => {
    const summary = summarizeChanges("juan", [
      { kind: "portfolio", template: "minimal", theme: "mono" },
    ])
    expect(summary.title).toBe("Update portfolio style: juan")
    expect(summary.commitMessage).toBe("chore: update portfolio style for juan")
    expect(summary.bullets).toEqual([
      "- `portfolio.template` → `minimal`",
      "- `portfolio.theme` → `mono`",
    ])
  })

  it("says so when a design leaves no palette to write", () => {
    const summary = summarizeChanges("juan", [
      { kind: "portfolio", template: "noir", theme: "mono" },
    ])
    expect(summary.bullets[1]).toBe(
      "- `portfolio.theme` removed — this design brings its own palette"
    )
  })

  it("falls back to plain settings when a style rides along with a toggle", () => {
    const summary = summarizeChanges("juan", [
      { kind: "feature", feature: "og", enabled: true },
      { kind: "portfolio", template: "minimal", theme: "mono" },
    ])
    expect(summary.title).toBe("Update settings: juan")
    expect(summary.bullets).toHaveLength(3)
  })
})

describe("branch naming", () => {
  it("round-trips a subdomain through the head label", () => {
    const label = `juandelacruz:${proxyBranch("juan")}`
    expect(subdomainFromHeadLabel(label, "juandelacruz")).toBe("juan")
  })

  it("ignores labels from another user", () => {
    expect(
      subdomainFromHeadLabel("someoneelse:proxy/juan", "juandelacruz")
    ).toBeNull()
  })

  it("ignores branches that are not proxy changes", () => {
    expect(
      subdomainFromHeadLabel(
        "juandelacruz:claim/portfolio-juan",
        "juandelacruz"
      )
    ).toBeNull()
  })

  it("ignores a bare proxy/ branch with no subdomain", () => {
    expect(
      subdomainFromHeadLabel("juandelacruz:proxy/", "juandelacruz")
    ).toBeNull()
  })
})
