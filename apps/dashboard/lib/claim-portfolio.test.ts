import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

import { buildDomainRecord, openPortfolioPR } from "./claim-portfolio"

const UPSTREAM_REF = "https://api.github.com/repos/is-pinoy-dev/domains/git/ref/heads/main"
const FORK_REF = "https://api.github.com/repos/juan/domains/git/ref/heads/main"
const UPSTREAM_SHA = "upstream-head-sha"
const FORK_SHA = "stale-fork-head-sha"

// No subdomain here on purpose: openPortfolioPR derives it from the login, so
// a claim is always addressed by the claimant's own GitHub username.
const params = {
  login: "juan",
  portfolio: { template: "bubblegum" as const },
}

interface Call {
  url: string
  method: string
  body: Record<string, unknown> | null
}

let calls: Call[]

/**
 * Minimal GitHub API stand-in. `branchExists` drives the 422 that a re-submit
 * of the same claim produces.
 */
function stubGitHub({
  branchExists = false,
  syncFails = false,
  fileOnBranch = false,
  forkMissingUpstreamSha = false,
} = {}) {
  calls = []
  const fetchMock = vi.fn(async (input: string, init?: RequestInit) => {
    const url = String(input)
    const method = init?.method ?? "GET"
    calls.push({
      url,
      method,
      body: init?.body ? JSON.parse(String(init.body)) : null,
    })

    // Fork already exists.
    if (url === "https://api.github.com/repos/juan/domains" && method === "GET") {
      return new Response(JSON.stringify({ default_branch: "main" }), { status: 200 })
    }
    if (
      url === "https://api.github.com/repos/is-pinoy-dev/domains" &&
      method === "GET"
    ) {
      return new Response(JSON.stringify({ default_branch: "main" }), { status: 200 })
    }
    if (url === UPSTREAM_REF) {
      return new Response(JSON.stringify({ object: { sha: UPSTREAM_SHA } }), {
        status: 200,
      })
    }
    if (url === FORK_REF) {
      return new Response(JSON.stringify({ object: { sha: FORK_SHA } }), { status: 200 })
    }
    if (url.endsWith("/merge-upstream") && method === "POST") {
      return syncFails
        ? new Response("{}", { status: 409 })
        : new Response("{}", { status: 200 })
    }
    if (url.endsWith("/git/refs") && method === "POST") {
      if (branchExists) return new Response("{}", { status: 422 })
      // Mirrors a fork whose network hasn't fetched the upstream commit: it
      // rejects a ref at that SHA but accepts one at its own head.
      const sha = init?.body ? JSON.parse(String(init.body)).sha : null
      if (forkMissingUpstreamSha && sha === UPSTREAM_SHA) {
        return new Response("{}", { status: 404 })
      }
      return new Response("{}", { status: 201 })
    }
    if (url.includes("/git/refs/heads/") && method === "PATCH") {
      return new Response("{}", { status: 200 })
    }
    if (url.includes("/contents/subdomains/")) {
      if (method === "GET") {
        return fileOnBranch
          ? new Response(JSON.stringify({ sha: "existing-blob-sha" }), { status: 200 })
          : new Response("{}", { status: 404 })
      }
      // Mirrors the contents API: overwriting without the blob sha is a 422.
      const body = init?.body ? JSON.parse(String(init.body)) : {}
      if (fileOnBranch && !body.sha) return new Response("{}", { status: 422 })
      return new Response("{}", { status: 201 })
    }
    if (url.endsWith("/pulls") && method === "POST") {
      return new Response(
        JSON.stringify({ html_url: "https://github.com/is-pinoy-dev/domains/pull/1" }),
        { status: 201 }
      )
    }
    return new Response("{}", { status: 404 })
  })
  vi.stubGlobal("fetch", fetchMock)
}

const find = (pred: (c: Call) => boolean) => calls.find(pred)

beforeEach(() => stubGitHub())
afterEach(() => vi.unstubAllGlobals())

describe("buildDomainRecord — the claimed name", () => {
  it("is the claimant's own GitHub username", () => {
    expect(buildDomainRecord(params)).toMatchObject({
      subdomain: "juan",
      owner: { github: "juan" },
    })
  })

  it("records the numeric account ID so a rename can't orphan the claim", () => {
    expect(buildDomainRecord({ ...params, githubId: 42 })).toMatchObject({
      owner: { github: "juan", id: 42 },
    })
  })

  it("omits the ID rather than writing a null the schema would reject", () => {
    // Sessions minted before githubId existed carry no ID until re-login.
    expect(buildDomainRecord(params).owner).not.toHaveProperty("id")
  })

  it("folds a mixed-case login down to a lowercase label", () => {
    // GitHub logins keep the case they were registered with; DNS labels and
    // the subdomains/<name>.json files are lowercase.
    const record = buildDomainRecord({ ...params, login: "JuanDelaCruz" })
    expect(record.subdomain).toBe("juandelacruz")
    expect(record.owner.github).toBe("JuanDelaCruz")
  })
})

describe("openPortfolioPR — claim branch base", () => {
  it("names the branch, file, and PR after the login, not a chosen name", async () => {
    // The whole point of dropping `subdomain` from ClaimParams: there is no
    // argument that could aim this at someone else's address.
    await openPortfolioPR("token", params)

    const write = find(
      (c) => c.url.includes("/contents/subdomains/") && c.method === "PUT"
    )
    expect(write?.url).toContain("/contents/subdomains/juan.json")
    expect(
      JSON.parse(
        Buffer.from(String(write?.body?.content), "base64").toString("utf8")
      )
    ).toMatchObject({ subdomain: "juan", owner: { github: "juan" } })
  })


  // The PR targets upstream, so basing the branch on a fork that was forked
  // once and never synced makes every commit upstream has merged since show up
  // in the diff as a revert — and fails CI on files the claimant never touched.
  it("bases the branch on upstream's head, not the fork's", async () => {
    const result = await openPortfolioPR("token", params)
    expect(result).toEqual({
      ok: true,
      prUrl: "https://github.com/is-pinoy-dev/domains/pull/1",
    })

    expect(find((c) => c.url === UPSTREAM_REF)).toBeDefined()
    expect(find((c) => c.url === FORK_REF)).toBeUndefined()

    const create = find((c) => c.url.endsWith("/git/refs") && c.method === "POST")
    expect(create?.body).toEqual({
      ref: "refs/heads/claim/portfolio-juan",
      sha: UPSTREAM_SHA,
    })
  })

  it("creates the branch on the fork, and the PR against upstream", async () => {
    await openPortfolioPR("token", params)

    const create = find((c) => c.url.endsWith("/git/refs") && c.method === "POST")
    expect(create?.url).toBe("https://api.github.com/repos/juan/domains/git/refs")

    const pr = find((c) => c.url.endsWith("/pulls") && c.method === "POST")
    expect(pr?.url).toBe("https://api.github.com/repos/is-pinoy-dev/domains/pulls")
    expect(pr?.body).toMatchObject({ head: "juan:claim/portfolio-juan", base: "main" })
  })

  it("resets an existing claim branch onto the current upstream head", async () => {
    // Reusing the branch as-is would inherit whatever base the earlier submit
    // was cut from — the same staleness, one resubmit later.
    stubGitHub({ branchExists: true })

    const result = await openPortfolioPR("token", params)
    expect(result).toMatchObject({ ok: true })

    const reset = find((c) => c.method === "PATCH")
    expect(reset?.url).toBe(
      "https://api.github.com/repos/juan/domains/git/refs/heads/claim/portfolio-juan"
    )
    expect(reset?.body).toEqual({ sha: UPSTREAM_SHA, force: true })
  })

  it("falls back to the fork's head when it doesn't hold the upstream commit", async () => {
    // A fork whose network hasn't fetched the upstream commit rejects a ref
    // created at it. Dead-ending the claim there is worse than a base that
    // syncForkDefaultBranch has usually just brought level with upstream.
    stubGitHub({ forkMissingUpstreamSha: true })

    const result = await openPortfolioPR("token", params)
    expect(result).toMatchObject({ ok: true })

    const creates = calls.filter(
      (c) => c.url.endsWith("/git/refs") && c.method === "POST"
    )
    expect(creates).toHaveLength(2)
    expect(creates[0]!.body).toMatchObject({ sha: UPSTREAM_SHA })
    expect(creates[1]!.body).toMatchObject({ sha: FORK_SHA })
  })

  it("fast-forwards the fork's default branch to upstream", async () => {
    await openPortfolioPR("token", params)

    const sync = find((c) => c.url.endsWith("/merge-upstream"))
    expect(sync?.url).toBe("https://api.github.com/repos/juan/domains/merge-upstream")
    expect(sync?.body).toEqual({ branch: "main" })
  })

  it("still opens the claim when the fork can't be fast-forwarded", async () => {
    // A fork with its own commits on its default branch answers 409. That's
    // housekeeping the claim's correctness doesn't depend on — the branch is
    // cut from upstream either way.
    stubGitHub({ syncFails: true })

    const result = await openPortfolioPR("token", params)
    expect(result).toMatchObject({ ok: true })

    const create = find((c) => c.url.endsWith("/git/refs") && c.method === "POST")
    expect(create?.body).toMatchObject({ sha: UPSTREAM_SHA })
  })

  it("overwrites a file a previous submit already committed", async () => {
    // Without the blob sha the contents API 422s, which surfaced to users as
    // "Could not add the subdomain file (422)" whenever they resubmitted a
    // claim — changing template, or retrying after any later step failed.
    stubGitHub({ branchExists: true, fileOnBranch: true })

    const result = await openPortfolioPR("token", params)
    expect(result).toMatchObject({ ok: true })

    const write = find(
      (c) => c.url.includes("/contents/subdomains/") && c.method === "PUT"
    )
    expect(write?.body).toMatchObject({ sha: "existing-blob-sha" })
  })

  it("sends no sha when the file is new", async () => {
    await openPortfolioPR("token", params)

    const write = find(
      (c) => c.url.includes("/contents/subdomains/") && c.method === "PUT"
    )
    expect(write?.body).not.toHaveProperty("sha")
  })

  it("only ever writes the claimed subdomain's own file", async () => {
    await openPortfolioPR("token", params)

    const writes = calls.filter(
      (c) => c.url.includes("/contents/") && c.method !== "GET"
    )
    expect(writes).toHaveLength(1)
    expect(writes[0]!.url).toContain("/contents/subdomains/juan.json")

    // Nor may it so much as read another subdomain's file.
    for (const c of calls.filter((c) => c.url.includes("/contents/"))) {
      expect(c.url).toContain("/contents/subdomains/juan.json")
    }
  })
})
