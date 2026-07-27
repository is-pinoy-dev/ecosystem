// Platform tools: what they are, and reading/writing their flags in a record.
//
// Two levels, both stored in git and both edited from the dashboard:
//
//   records.{A,CNAME}.proxied  — the master switch. Cloudflare only sees a
//                                request it proxies, so nothing under /_tools/
//                                can run without it (docs/tools/index.mdx).
//   features.tools.<id>        — per-tool opt-in on top of that.
//
// Kept free of server-only imports so it can be unit tested.

/** A platform tool the owner can switch on for a subdomain. */
export interface Tool {
  /** Key under `features.tools` in the record file. */
  id: string
  name: string
  description: string
  docsUrl: string
  /**
   * Whether the tool's worker actually reads this flag today. A tool that is
   * not enforced would give the owner a switch that changes nothing, so the
   * dashboard hides it until its worker gates on the flag.
   */
  enforced: boolean
}

export const TOOLS: Tool[] = [
  {
    id: "site-audit",
    name: "Site Audit",
    description:
      "Audit your site's SEO and OpenGraph metadata from /_tools/site-audit.",
    docsUrl: "https://docs.is-pinoy.dev/tools/site-audit",
    enforced: true,
  },
  {
    id: "og",
    name: "OG Images",
    description: "Generated OpenGraph images for your subdomain.",
    docsUrl: "https://docs.is-pinoy.dev/tools",
    // tools/og/worker/index.ts resolves the record for `owner.github` only and
    // never consults features.tools.og — it serves every registered subdomain.
    // Flip this to true once that worker gates on the flag.
    enforced: false,
  },
]

/** Tools the dashboard offers — those whose workers honour the flag. */
export const AVAILABLE_TOOLS = TOOLS.filter((tool) => tool.enforced)

export function findTool(id: string): Tool | undefined {
  return TOOLS.find((tool) => tool.id === id)
}

/** Is this tool switched on for a record? Absent means off. */
export function isToolEnabled(
  features: Record<string, unknown> | null | undefined,
  toolId: string
): boolean {
  if (!features || typeof features !== "object") return false
  const tools = (features as { tools?: unknown }).tools
  if (!tools || typeof tools !== "object") return false
  return (tools as Record<string, unknown>)[toolId] === true
}

/**
 * Set one tool's flag, returning a new features object. Never mutates, and
 * builds the nested shape when the record has no `features` block yet.
 */
export function setToolEnabled(
  features: Record<string, unknown> | null | undefined,
  toolId: string,
  enabled: boolean
): Record<string, unknown> {
  const base =
    features && typeof features === "object"
      ? (features as Record<string, unknown>)
      : {}
  const tools =
    base.tools && typeof base.tools === "object"
      ? (base.tools as Record<string, unknown>)
      : {}

  return { ...base, tools: { ...tools, [toolId]: enabled } }
}
