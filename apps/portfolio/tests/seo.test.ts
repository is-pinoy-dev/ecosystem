import { describe, expect, it } from "vitest"
import type { PortfolioData } from "../lib/portfolio-data"
import {
  avatarUrl,
  backgroundFor,
  buildJsonLd,
  descriptionFor,
  displayName,
  iconsFor,
  isLight,
  keywordsFor,
  manifestFor,
  originFor,
  topLanguages,
} from "../lib/seo"

const AVATAR = "https://avatars.githubusercontent.com/u/1?v=4"

function data(overrides: Partial<PortfolioData> = {}): PortfolioData {
  return {
    profile: {
      login: "juandelacruz",
      name: "Juan dela Cruz",
      avatar: AVATAR,
      bio: "Backend engineer building things for Filipino developers.",
      location: "Manila, Philippines",
      company: "@is-pinoy-dev",
      twitter: "juandev",
      links: [
        { label: "Website", href: "https://juan.dev" },
        { label: "GitHub", href: "https://github.com/juandelacruz" },
      ],
      ...overrides.profile,
    },
    readmeHtml: "",
    repos: [
      {
        name: "api",
        description: "An API",
        url: "https://github.com/juandelacruz/api",
        language: "Go",
        stars: 12,
      },
      {
        name: "cli",
        description: null,
        url: "https://github.com/juandelacruz/cli",
        language: "Go",
        stars: 4,
      },
      {
        name: "site",
        description: "A site",
        url: "https://github.com/juandelacruz/site",
        language: "TypeScript",
        stars: 2,
      },
    ],
    stats: { followers: 30, publicRepos: 9 },
    ...overrides,
  }
}

describe("originFor", () => {
  it("is the claimed subdomain when there is one", () => {
    expect(originFor("juan")).toBe("https://juan.is-pinoy.dev")
  })

  // A preview and the dev fallback render on the renderer host, which is not
  // the canonical home of the profile being displayed.
  it("falls back to the renderer host", () => {
    expect(originFor(null)).toBe("https://portfolio.is-pinoy.dev")
  })
})

describe("avatarUrl", () => {
  it("sets the size without dropping GitHub's own query", () => {
    const url = new URL(avatarUrl(AVATAR, 180))
    expect(url.searchParams.get("s")).toBe("180")
    expect(url.searchParams.get("v")).toBe("4")
  })

  it("replaces a size already present rather than appending a second", () => {
    const once = avatarUrl(AVATAR, 32)
    expect(avatarUrl(once, 512)).toBe(avatarUrl(AVATAR, 512))
  })

  it("passes through anything that isn't an absolute URL", () => {
    expect(avatarUrl("/local.png", 32)).toBe("/local.png")
  })
})

describe("backgroundFor", () => {
  it("keys designer templates on the template, not the theme", () => {
    expect(backgroundFor("noir", "sunset")).toBe("#0a0a09")
  })

  it("keys layout templates on the theme", () => {
    expect(backgroundFor("terminal", "matrix")).toBe("#030503")
  })

  it("falls back to the base dark tokens for gold-dark and for unknowns", () => {
    expect(backgroundFor("terminal")).toBe("#0b0d12")
    expect(backgroundFor("terminal", "not-a-theme")).toBe("#0b0d12")
    expect(backgroundFor("not-a-template")).toBe("#0b0d12")
  })
})

describe("isLight", () => {
  // color-scheme is derived from luminance so a new designer template gets the
  // right answer from its hex alone, with no list to remember to update.
  it("classifies every shipped background the way a human would", () => {
    for (const dark of ["#0a0a09", "#020402", "#0a2036", "#0b0d12", "#14090b"]) {
      expect(isLight(dark), dark).toBe(false)
    }
    for (const light of ["#e8e8e6", "#f6f2e9", "#ffffff", "#dce7d5", "#ffe0ec"]) {
      expect(isLight(light), light).toBe(true)
    }
  })

  it("accepts shorthand hex", () => {
    expect(isLight("#fff")).toBe(true)
    expect(isLight("#000")).toBe(false)
  })
})

describe("topLanguages", () => {
  it("ranks by how many repos use them", () => {
    expect(topLanguages(data())).toEqual(["Go", "TypeScript"])
  })

  it("ignores repos with no detected language", () => {
    const d = data()
    d.repos = d.repos.map((r) => ({ ...r, language: null }))
    expect(topLanguages(d)).toEqual([])
  })
})

describe("descriptionFor", () => {
  it("leads with the owner's own bio", () => {
    expect(descriptionFor(data())).toMatch(/^Backend engineer building things/)
  })

  it("stays inside what a search result will show", () => {
    expect(descriptionFor(data()).length).toBeLessThanOrEqual(200)
  })

  it("drops the extras rather than truncating a long bio", () => {
    const d = data()
    d.profile.bio = "x".repeat(150)
    const description = descriptionFor(d)
    expect(description).toBe("x".repeat(150))
    expect(description).not.toContain("Based in")
  })

  it("writes a sentence for a profile with no bio at all", () => {
    const d = data()
    d.profile.bio = null
    expect(descriptionFor(d)).toContain("Juan dela Cruz's developer portfolio")
  })

  it("falls back to the login when there is no name", () => {
    const d = data()
    d.profile.name = null
    d.profile.bio = null
    expect(displayName(d.profile)).toBe("juandelacruz")
    expect(descriptionFor(d)).toContain("juandelacruz's developer portfolio")
  })
})

describe("keywordsFor", () => {
  it("covers the name, the handle, the languages and the location", () => {
    const keywords = keywordsFor(data())
    expect(keywords).toContain("Juan dela Cruz")
    expect(keywords).toContain("juandelacruz")
    expect(keywords).toContain("Go")
    expect(keywords).toContain("Manila, Philippines")
    // The `@` in GitHub's company field is a GitHub convention, not part of the
    // organization's name.
    expect(keywords).toContain("is-pinoy-dev")
  })

  it("has no duplicates", () => {
    const keywords = keywordsFor(data())
    expect(new Set(keywords).size).toBe(keywords.length)
  })
})

describe("iconsFor", () => {
  it("serves the avatar at the size each slot actually needs", () => {
    const icons = iconsFor(AVATAR)
    expect(icons.icon.map((i) => i.sizes)).toEqual([
      "32x32",
      "96x96",
      "192x192",
    ])
    expect(icons.icon[0]!.url).toContain("s=32")
    expect(icons.apple[0]!.url).toContain("s=180")
  })
})

describe("manifestFor", () => {
  it("installs as the owner's site, in the colors of their template", () => {
    const manifest = manifestFor({ data: data(), template: "noir" })
    expect(manifest.name).toBe("Juan dela Cruz — Portfolio")
    expect(manifest.short_name).toBe("juandelacruz")
    expect(manifest.start_url).toBe("/")
    expect(manifest.display).toBe("standalone")
    expect(manifest.orientation).toBe("any")
    expect(manifest.theme_color).toBe("#0a0a09")
    expect(manifest.background_color).toBe("#0a0a09")
  })

  // Installability needs both sizes; browsers reject the prompt without them.
  it("declares the 192 and 512 icons an installable app needs", () => {
    const manifest = manifestFor({ data: data(), template: "terminal" })
    expect(manifest.icons?.map((i) => i.sizes)).toEqual(["192x192", "512x512"])
    expect(manifest.icons?.[1]!.src).toContain("s=512")
  })
})

describe("buildJsonLd", () => {
  const graph = buildJsonLd({
    data: data(),
    origin: "https://juan.is-pinoy.dev",
  })
  const nodes = graph["@graph"] as Record<string, unknown>[]
  const node = (type: string) => nodes.find((n) => n["@type"] === type)!

  it("describes the owner as a Person anchored to this origin", () => {
    const person = node("Person")
    expect(person["@id"]).toBe("https://juan.is-pinoy.dev/#person")
    expect(person.name).toBe("Juan dela Cruz")
    expect(person.url).toBe("https://juan.is-pinoy.dev")
    expect(person.alternateName).toBe("juandelacruz")
    expect(person.knowsAbout).toEqual(["Go", "TypeScript"])
  })

  // sameAs is what ties this origin to the accounts behind it; without the
  // GitHub URL a crawler has no way to know the two are the same person.
  it("carries every profile link as sameAs", () => {
    expect(node("Person").sameAs).toEqual([
      "https://juan.dev",
      "https://github.com/juandelacruz",
    ])
  })

  it("points the page and the site at that one Person node", () => {
    expect(node("ProfilePage").mainEntity).toEqual({
      "@id": "https://juan.is-pinoy.dev/#person",
    })
    expect(node("WebSite").publisher).toEqual({
      "@id": "https://juan.is-pinoy.dev/#person",
    })
  })

  // Every @id the graph references has to resolve to a node in it; a dangling
  // primaryImageOfPage is a validation error rather than a missing image.
  it("resolves every internal @id reference", () => {
    const ids = new Set<string>()
    const referenced = new Set<string>()
    const walk = (value: unknown) => {
      if (Array.isArray(value)) return value.forEach(walk)
      if (!value || typeof value !== "object") return
      const record = value as Record<string, unknown>
      const id = record["@id"]
      if (typeof id === "string") {
        if (Object.keys(record).length === 1) referenced.add(id)
        else ids.add(id)
      }
      Object.values(record).forEach(walk)
    }
    walk(nodes)
    expect(referenced.size).toBeGreaterThan(0)
    for (const id of referenced) expect([...ids]).toContain(id)
  })

  it("lists the repos as authored source code, in rendered order", () => {
    const list = node("ItemList")
    expect(list.numberOfItems).toBe(3)
    const items = list.itemListElement as { position: number; item: Record<string, unknown> }[]
    expect(items.map((i) => i.position)).toEqual([1, 2, 3])
    expect(items[0]!.item.name).toBe("api")
    expect(items[0]!.item.programmingLanguage).toBe("Go")
    // A repo with no description must not emit an empty one.
    expect(items[1]!.item).not.toHaveProperty("description")
  })

  it("omits optional nodes a sparse profile can't fill", () => {
    const sparse = data()
    sparse.profile.location = null
    sparse.profile.company = null
    sparse.repos = []
    const nodes = buildJsonLd({
      data: sparse,
      origin: "https://juan.is-pinoy.dev",
    })["@graph"] as Record<string, unknown>[]
    const person = nodes.find((n) => n["@type"] === "Person")!
    expect(person).not.toHaveProperty("address")
    expect(person).not.toHaveProperty("worksFor")
    expect(nodes.find((n) => n["@type"] === "ItemList")).toBeUndefined()
  })

  it("serializes without a sequence that can close the script tag", () => {
    const hostile = data()
    hostile.profile.bio = "</script><img src=x onerror=alert(1)>"
    const json = JSON.stringify(
      buildJsonLd({ data: hostile, origin: "https://juan.is-pinoy.dev" }),
    ).replace(/</g, "\\u003c")
    expect(json).not.toContain("</script>")
    expect(JSON.parse(json)).toBeTruthy()
  })
})
