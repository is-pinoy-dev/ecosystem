import { describe, it, expect } from "vitest"

import { domainSchema } from "@is-pinoy-dev/schemas"

// The Contact Form tool emails the destination address directly via
// Cloudflare Email Routing — there is no submissions store, so
// `contactForm.email` is the only place a submission can go. A record with
// the flag on and no email would silently have nowhere to deliver mail, so
// the schema itself refuses to accept one.
//
// `contactForm.email` is a dedicated field, deliberately decoupled from the
// general-purpose, maintainer-contact `owner.email` field: setting one must
// never satisfy the other.
describe("domainSchema — contact-form requires contactForm.email", () => {
  const base = {
    subdomain: "jun",
    owner: { github: "bosquejun" },
    records: { CNAME: { type: "CNAME" as const, value: "jun.vercel.app" } },
  }

  it("accepts contact-form enabled when contactForm.email is set", () => {
    const result = domainSchema.safeParse({
      ...base,
      contactForm: { email: "jun@example.com" },
      features: { tools: { "contact-form": true } },
    })
    expect(result.success).toBe(true)
  })

  it("rejects contact-form enabled when contactForm.email is unset", () => {
    const result = domainSchema.safeParse({
      ...base,
      features: { tools: { "contact-form": true } },
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path.join(".") === "contactForm.email" &&
            issue.message.includes("contact-form")
        )
      ).toBe(true)
    }
  })

  it("rejects contact-form enabled when only owner.email is set (regression: owner.email and contactForm.email are decoupled)", () => {
    const result = domainSchema.safeParse({
      ...base,
      owner: { ...base.owner, email: "jun@example.com" },
      features: { tools: { "contact-form": true } },
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) =>
            issue.path.join(".") === "contactForm.email" &&
            issue.message.includes("contact-form")
        )
      ).toBe(true)
    }
  })

  it("allows a missing contactForm.email when contact-form is off or absent", () => {
    expect(domainSchema.safeParse(base).success).toBe(true)
    expect(
      domainSchema.safeParse({
        ...base,
        features: { tools: { "contact-form": false } },
      }).success
    ).toBe(true)
  })
})
