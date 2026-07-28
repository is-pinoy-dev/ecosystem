import { describe, it, expect } from "vitest"
import { parsePreview } from "../lib/context"

// The dashboard's Preview link is the only writer of these params, but the URL
// is public and hand-editable, so the parser is an input boundary: `github` is
// interpolated into a GitHub API path by lib/github.ts.
describe("parsePreview", () => {
  it("returns null when not a preview request", () => {
    expect(parsePreview({ github: "maria" })).toBeNull()
  })

  it("reads the github param", () => {
    expect(parsePreview({ preview: "1", github: "maria-santos" })).toEqual({
      github: "maria-santos",
      template: "terminal",
      theme: undefined,
    })
  })

  it("does not accept the former `login` param", () => {
    expect(parsePreview({ preview: "1", login: "maria" })).toBeNull()
  })

  it("constrains template and theme to the known enums", () => {
    expect(
      parsePreview({
        preview: "1",
        github: "maria",
        template: "broadsheet",
        theme: "midnight",
      })
    ).toEqual({ github: "maria", template: "broadsheet", theme: "midnight" })

    // Unknown values fall back rather than reaching the renderer.
    expect(
      parsePreview({
        preview: "1",
        github: "maria",
        template: "../../etc/passwd",
        theme: "nope",
      })
    ).toEqual({ github: "maria", template: "terminal", theme: undefined })
  })

  it("rejects usernames outside GitHub's shape", () => {
    for (const github of [
      "",
      "  ",
      "maria/../admin",
      "maria?tab=repos",
      "maria santos",
      "a".repeat(40),
    ]) {
      expect(parsePreview({ preview: "1", github })).toBeNull()
    }
  })

  it("ignores repeated params rather than taking the first", () => {
    expect(parsePreview({ preview: "1", github: ["a", "b"] })).toBeNull()
  })
})
