import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getSubdomainsForOwner } from "./domains"
import { claimBlockLink, claimBlockMessage } from "./portfolio-claim-block"
import { getClaimBlock } from "./portfolio-claim-status"

// `isOwnedBy` stays real — the login/id matching rules are part of what is
// under test here. Only the registry read is replaced, because it is the one
// that would otherwise reach D1 or GitHub.
vi.mock("./domains", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./domains")>()),
  getSubdomainsForOwner: vi.fn(),
}))

const scan = vi.mocked(getSubdomainsForOwner)

const OWNER = { login: "juan", githubId: 42 }
const RAW =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/juan.json"
const PULLS =
  "https://api.github.com/repos/is-pinoy-dev/domains/pulls?state=open&head=juan:claim/portfolio-juan&per_page=1"

const PORTFOLIO_CNAME = { CNAME: { value: "portfolio.is-pinoy.dev", proxied: true } }
const OWN_HOST_CNAME = { CNAME: { value: "juan.vercel.app", proxied: true } }

type FileResponse =
  | { kind: "json"; body: unknown }
  | { kind: "status"; status: number }
  | { kind: "throw" }
  | { kind: "malformed" }

let calls: string[]

function stubFetch({
  file = { kind: "status", status: 404 } as FileResponse,
  prs = [] as unknown[],
  prsFail = false,
}) {
  calls = []
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string) => {
      const url = String(input)
      calls.push(url)

      if (url.startsWith("https://raw.githubusercontent.com")) {
        if (file.kind === "throw") throw new Error("network down")
        if (file.kind === "status") return new Response(null, { status: file.status })
        if (file.kind === "malformed") return new Response("not json{", { status: 200 })
        return new Response(JSON.stringify(file.body), { status: 200 })
      }

      if (url.startsWith("https://api.github.com")) {
        if (prsFail) return new Response(null, { status: 403 })
        return new Response(JSON.stringify(prs), { status: 200 })
      }

      throw new Error(`unexpected fetch: ${url}`)
    }),
  )
}

/** The registry scan, as it answers when the user holds `subdomain`. */
function scanHolds(subdomain: string | null, ownerId = 42) {
  scan.mockResolvedValue({
    owned: subdomain
      ? [
          {
            subdomain,
            owner: { github: "juan", id: ownerId },
            records: PORTFOLIO_CNAME,
          },
        ]
      : [],
    registryTotal: subdomain ? 1 : 0,
  })
}

const openPR = [{ html_url: "https://github.com/is-pinoy-dev/domains/pull/7", number: 7 }]

beforeEach(() => {
  scan.mockReset()
  scanHolds(null)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("getClaimBlock", () => {
  it("returns null when nothing stands in the way", async () => {
    stubFetch({})
    await expect(getClaimBlock(OWNER, "juan")).resolves.toBeNull()
  })

  it("reports a portfolio the user already holds at their own name", async () => {
    stubFetch({
      file: {
        kind: "json",
        body: { owner: { github: "juan", id: 42 }, records: PORTFOLIO_CNAME },
      },
    })

    await expect(getClaimBlock(OWNER, "juan")).resolves.toEqual({
      kind: "hosted",
      subdomain: "juan",
      renamed: false,
    })
  })

  it("settles the common hosted case without scanning the registry", async () => {
    stubFetch({
      file: {
        kind: "json",
        body: { owner: { github: "juan", id: 42 }, records: PORTFOLIO_CNAME },
      },
    })

    await getClaimBlock(OWNER, "juan")

    // The scan is the expensive read — with D1 unconfigured it fetches every
    // record in the registry. One file read has already answered the question.
    expect(scan).not.toHaveBeenCalled()
    expect(calls.filter((url) => url.startsWith("https://raw"))).toHaveLength(1)
  })

  it("finds a portfolio held under a previous GitHub username", async () => {
    stubFetch({})
    scanHolds("juanito")

    await expect(getClaimBlock(OWNER, "juan")).resolves.toEqual({
      kind: "hosted",
      subdomain: "juanito",
      renamed: true,
      wanted: "juan",
    })
  })

  it("treats a record owned by someone else as taken", async () => {
    stubFetch({
      file: {
        kind: "json",
        body: { owner: { github: "maria", id: 99 }, records: PORTFOLIO_CNAME },
      },
    })

    await expect(getClaimBlock(OWNER, "juan")).resolves.toEqual({
      kind: "taken",
      subdomain: "juan",
    })
  })

  it("treats the user's own non-portfolio record as taken, not hosted", async () => {
    stubFetch({
      file: {
        kind: "json",
        body: { owner: { github: "juan", id: 42 }, records: OWN_HOST_CNAME },
      },
    })

    // Pointing your subdomain at your own host is not a hosted portfolio, but
    // the name is still spoken for.
    await expect(getClaimBlock(OWNER, "juan")).resolves.toEqual({
      kind: "taken",
      subdomain: "juan",
    })
  })

  it("does not call a record flagged for destruction a live portfolio", async () => {
    stubFetch({
      file: {
        kind: "json",
        body: {
          owner: { github: "juan", id: 42 },
          records: PORTFOLIO_CNAME,
          destroy: true,
        },
      },
    })

    await expect(getClaimBlock(OWNER, "juan")).resolves.toEqual({
      kind: "taken",
      subdomain: "juan",
    })
  })

  it("recognises a bare-string CNAME as a portfolio record", async () => {
    stubFetch({
      file: {
        kind: "json",
        body: {
          owner: { github: "juan", id: 42 },
          records: { CNAME: "Portfolio.Is-Pinoy.Dev" },
        },
      },
    })

    await expect(getClaimBlock(OWNER, "juan")).resolves.toMatchObject({
      kind: "hosted",
    })
  })

  it("reports an open claim pull request", async () => {
    stubFetch({ prs: openPR })

    await expect(getClaimBlock(OWNER, "juan")).resolves.toEqual({
      kind: "pending",
      subdomain: "juan",
      url: "https://github.com/is-pinoy-dev/domains/pull/7",
      number: 7,
    })
  })

  it("reads the record file and the claim branch's pull request", async () => {
    stubFetch({})
    await getClaimBlock(OWNER, "juan")

    // Pinned because both are silent failures if they drift: a wrong record
    // path 404s and reads as "unclaimed", and a wrong head label returns an
    // empty list and reads as "no pull request open".
    expect(calls).toContain(RAW)
    expect(calls).toContain(PULLS)
  })

  describe("precedence", () => {
    it("prefers a held portfolio over an open pull request", async () => {
      stubFetch({
        file: {
          kind: "json",
          body: { owner: { github: "juan", id: 42 }, records: PORTFOLIO_CNAME },
        },
        prs: openPR,
      })

      await expect(getClaimBlock(OWNER, "juan")).resolves.toMatchObject({
        kind: "hosted",
      })
    })

    it("prefers an open pull request over a bare taken name", async () => {
      stubFetch({
        file: {
          kind: "json",
          body: { owner: { github: "maria", id: 99 }, records: PORTFOLIO_CNAME },
        },
        prs: openPR,
      })

      await expect(getClaimBlock(OWNER, "juan")).resolves.toMatchObject({
        kind: "pending",
      })
    })
  })

  // The claim page disables its only submit button on this answer. A read that
  // fails must not be able to leave someone permanently unable to claim — the
  // server action and CI are what actually gate a claim.
  describe("fails open", () => {
    it("when the registry file read throws", async () => {
      stubFetch({ file: { kind: "throw" } })
      await expect(getClaimBlock(OWNER, "juan")).resolves.toBeNull()
    })

    it("when the registry answers with a server error", async () => {
      stubFetch({ file: { kind: "status", status: 500 } })
      await expect(getClaimBlock(OWNER, "juan")).resolves.toBeNull()
    })

    it("when the registry file is malformed", async () => {
      stubFetch({ file: { kind: "malformed" } })
      await expect(getClaimBlock(OWNER, "juan")).resolves.toBeNull()
    })

    it("when the owner scan throws", async () => {
      stubFetch({})
      scan.mockRejectedValue(new Error("D1 unreachable"))
      await expect(getClaimBlock(OWNER, "juan")).resolves.toBeNull()
    })

    it("when the pull request listing is rate limited", async () => {
      stubFetch({ prsFail: true })
      await expect(getClaimBlock(OWNER, "juan")).resolves.toBeNull()
    })

    it("but still reports a pull request it did manage to read", async () => {
      // The file read failed, so nothing is established about the address —
      // except this, which we read successfully and which is worth saying.
      stubFetch({ file: { kind: "status", status: 500 }, prs: openPR })
      await expect(getClaimBlock(OWNER, "juan")).resolves.toMatchObject({
        kind: "pending",
      })
    })
  })

  it("does not hand a record to a freed login that now belongs to someone else", async () => {
    stubFetch({
      file: {
        kind: "json",
        // Same login, different account: the original holder renamed and this
        // login was picked up by somebody new.
        body: { owner: { github: "juan", id: 7 }, records: PORTFOLIO_CNAME },
      },
    })

    await expect(getClaimBlock(OWNER, "juan")).resolves.toEqual({
      kind: "taken",
      subdomain: "juan",
    })
  })

  it("passes a token through to the pull request listing", async () => {
    stubFetch({})
    await getClaimBlock(OWNER, "juan", { token: "gho_secret" })

    const call = vi.mocked(fetch).mock.calls.find(([url]) =>
      String(url).startsWith("https://api.github.com"),
    )
    const headers = (call?.[1] as RequestInit | undefined)?.headers as
      | Record<string, string>
      | undefined
    expect(headers?.Authorization).toBe("Bearer gho_secret")
  })

  describe("checkPending: false", () => {
    it("does not list pull requests at all", async () => {
      stubFetch({ prs: openPR })
      await getClaimBlock(OWNER, "juan", { checkPending: false })

      expect(calls.some((url) => url.startsWith("https://api.github.com"))).toBe(
        false,
      )
    })

    it("lets a claim with an open pull request through", async () => {
      // The server action relies on this: resubmitting updates the open pull
      // request with a revised template, which is the only way to change your
      // mind before it merges.
      stubFetch({ prs: openPR })
      await expect(
        getClaimBlock(OWNER, "juan", { checkPending: false }),
      ).resolves.toBeNull()
    })

    it("still reports a name that is genuinely taken", async () => {
      stubFetch({
        file: {
          kind: "json",
          body: { owner: { github: "maria", id: 99 }, records: PORTFOLIO_CNAME },
        },
        prs: openPR,
      })

      await expect(
        getClaimBlock(OWNER, "juan", { checkPending: false }),
      ).resolves.toEqual({ kind: "taken", subdomain: "juan" })
    })
  })
})

describe("claimBlockMessage", () => {
  it("names the address a hosted portfolio already occupies", () => {
    expect(
      claimBlockMessage({ kind: "hosted", subdomain: "juan", renamed: false }),
    ).toBe("You already have a hosted portfolio at juan.is-pinoy.dev.")
  })

  it("explains a portfolio held under a previous username", () => {
    // Without the explanation this reads as a bug: the address named is not the
    // one the person just tried to claim. Both have to appear.
    const message = claimBlockMessage({
      kind: "hosted",
      subdomain: "juanito",
      renamed: true,
      wanted: "juan",
    })
    expect(message).toContain("juanito.is-pinoy.dev")
    expect(message).toContain("juan.is-pinoy.dev")
    expect(message).toContain("previous GitHub username")
  })

  it("names the pull request a pending claim is waiting on", () => {
    expect(
      claimBlockMessage({
        kind: "pending",
        subdomain: "juan",
        url: "https://example.test/7",
        number: 7,
      }),
    ).toContain("#7")
  })

  it("states plainly that a name is taken", () => {
    expect(claimBlockMessage({ kind: "taken", subdomain: "juan" })).toBe(
      "juan.is-pinoy.dev is already claimed.",
    )
  })
})

describe("claimBlockLink", () => {
  it("sends a portfolio holder to the domain they hold", () => {
    expect(
      claimBlockLink({ kind: "hosted", subdomain: "juanito", renamed: false }),
    ).toMatchObject({ href: "/domains/juanito", external: false })
  })

  it("sends a renamed holder to the address they actually hold", () => {
    // Not `wanted` — that address is not theirs and has no settings page.
    expect(
      claimBlockLink({
        kind: "hosted",
        subdomain: "juanito",
        renamed: true,
        wanted: "juan",
      }),
    ).toMatchObject({ href: "/domains/juanito" })
  })

  it("sends a pending claim to its pull request", () => {
    expect(
      claimBlockLink({
        kind: "pending",
        subdomain: "juan",
        url: "https://example.test/7",
        number: 7,
      }),
    ).toEqual({
      href: "https://example.test/7",
      label: "View pull request #7",
      external: true,
    })
  })

  it("sends a taken name to the record that took it", () => {
    expect(claimBlockLink({ kind: "taken", subdomain: "juan" })).toMatchObject({
      href: "https://github.com/is-pinoy-dev/domains/blob/main/subdomains/juan.json",
      external: true,
    })
  })
})
