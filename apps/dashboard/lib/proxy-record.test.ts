import { describe, expect, it } from "vitest"

import {
  buildToggledFile,
  proxyBranch,
  proxyLockReason,
  readProxyState,
  readProxyStates,
  setProxied,
  subdomainFromHeadLabel,
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

describe("proxyLockReason", () => {
  it("pins a hosted portfolio's CNAME", () => {
    const records = {
      CNAME: { value: "portfolio.is-pinoy.dev", proxied: true },
    }
    expect(proxyLockReason(records, "CNAME")).toMatch(/Hosted portfolios/)
  })

  it("matches the portfolio target case-insensitively and with a trailing dot", () => {
    const records = {
      CNAME: { value: "Portfolio.Is-Pinoy.Dev.", proxied: true },
    }
    expect(proxyLockReason(records, "CNAME")).not.toBeNull()
  })

  it("leaves an ordinary CNAME free to toggle", () => {
    const records = { CNAME: { value: "juan.github.io", proxied: true } }
    expect(proxyLockReason(records, "CNAME")).toBeNull()
  })

  it("never locks an A record", () => {
    const records = {
      A: { value: "1.2.3.4" },
      CNAME: { value: "portfolio.is-pinoy.dev" },
    }
    expect(proxyLockReason(records, "A")).toBeNull()
  })
})

describe("buildToggledFile", () => {
  it("emits schema-valid JSON with a trailing newline", () => {
    const result = buildToggledFile(
      file({ CNAME: { value: "juan.github.io", proxied: false } }),
      "CNAME",
      true
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
    const result = buildToggledFile(source, "CNAME", false)
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.$schema).toBe(source.$schema)
    expect(parsed.records.CNAME.proxied).toBe(false)
  })

  it("preserves unrelated blocks such as features", () => {
    const source = {
      ...file({ A: { value: "1.2.3.4" } }),
      features: { tools: { og: true } },
    }
    const result = buildToggledFile(source, "A", true)
    const parsed = JSON.parse((result as { content: string }).content)
    expect(parsed.features).toEqual({ tools: { og: true } })
  })

  it("rejects a file with no records block", () => {
    expect(buildToggledFile({ subdomain: "juan" }, "A", true)).toEqual({
      error: "The record file has no records block.",
    })
  })

  it("rejects a record the schema would fail", () => {
    const result = buildToggledFile(
      file({ A: { value: "not-an-ip" } }),
      "A",
      true
    )
    expect(result).toHaveProperty("error")
  })

  it("rejects a reserved subdomain the CI check would reject", () => {
    const result = buildToggledFile(
      { ...file({ CNAME: { value: "x.io" } }), subdomain: "www" },
      "CNAME",
      true
    )
    expect(result).toHaveProperty("error")
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
