import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeStringify from "rehype-stringify"
import type { Schema } from "hast-util-sanitize"
import type { Element, Node, Root, RootContent, Text } from "hast"

// SECURITY — hard gate. Profile READMEs are arbitrary user markdown *and* HTML,
// and we serve them on *.is-pinoy.dev. Anything unsanitized here is stored XSS
// on our own domain (session theft across subdomains). We start from
// rehype-sanitize's default allow-list (already strips <script>, event
// handlers, javascript: URLs) and tighten image sources to known-safe hosts so
// a README can't beacon arbitrary origins or smuggle SVG-based script.
const IMG_ALLOW_HOSTS = [
  "avatars.githubusercontent.com",
  "raw.githubusercontent.com",
  "github.com",
  "img.shields.io",
]

// Elements that must be removed *with their children*. The default sanitizer
// only strips `script` this way; every other disallowed element has its tag
// dropped but its text kept — which for these means CSS source, <title> text,
// or an <iframe>'s fallback copy leaking onto the page as visible prose. They
// carry no prose worth keeping, so they go wholesale.
const STRIP_WITH_CONTENT = [
  "script",
  "style",
  "title",
  "textarea",
  "noscript",
  "template",
  "xmp",
  "iframe",
  "object",
  "embed",
  "svg",
  "math",
]

const schema: Schema = {
  ...defaultSchema,
  strip: [...new Set([...(defaultSchema.strip ?? []), ...STRIP_WITH_CONTENT])],
  attributes: {
    ...defaultSchema.attributes,
    img: [...(defaultSchema.attributes?.img ?? []), "loading"],
  },
  // Only http/https/mailto for links; only https for images. `remark-rehype`
  // + this list means unknown protocols (javascript:, data:) are dropped.
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
    src: ["https"],
  },
}

/**
 * Render a profile README (markdown, possibly with embedded HTML) to sanitized
 * HTML. Returns "" for empty input. External image hosts outside the allow-list
 * are neutralized by rewriting to a blank src after sanitization.
 *
 * `sections` is the subdomain's optional `portfolio.sections` allow-list: the
 * heading slugs to keep, in the order to render them. Omitted or empty → the
 * whole README in document order.
 */
export async function renderReadme(
  markdown: string,
  sections?: string[],
): Promise<string> {
  if (!markdown.trim()) return ""

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    // Profile READMEs are mostly raw HTML (centered avatars, badge rows).
    // rehype-raw parses those raw strings into real HAST nodes so the sanitizer
    // can allow-list them; without it, sanitize drops all raw HTML wholesale.
    // Order matters: raw-parse first, THEN sanitize.
    .use(rehypeRaw)
    .use(rehypeSanitize, schema)
    // Selection runs on the sanitized tree, so it can only ever remove or
    // reorder already-safe nodes — it is not part of the security boundary.
    .use(rehypeSelectSections, sections)
    .use(rehypeStringify)
    .process(markdown)

  return stripDisallowedImages(String(file))
}

/** GitHub-style heading slug: lowercase, punctuation dropped, spaces hyphenated. */
export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
}

function textOf(node: Node): string {
  if (node.type === "text") return (node as Text).value
  const children = (node as Element).children
  if (!children) return ""
  return children.map(textOf).join("")
}

/**
 * Keep only the README sections named in `sections`, in that order.
 *
 * Sections are delimited by the shallowest heading level the document actually
 * uses (so a README written entirely in `##` splits on `##`, not `#`). Content
 * before the first heading — the avatar/badge block most profile READMEs open
 * with — belongs to no section and is always kept. Unknown slugs are ignored.
 */
function rehypeSelectSections(sections?: string[]) {
  return (tree: Root) => {
    if (!sections?.length) return

    const isHeading = (n: RootContent): n is Element =>
      n.type === "element" && /^h[1-6]$/.test((n as Element).tagName)

    const depths = tree.children.filter(isHeading).map((n) => Number(n.tagName[1]))
    if (depths.length === 0) return
    const splitDepth = Math.min(...depths)

    const preamble: RootContent[] = []
    const groups: { slug: string; nodes: RootContent[] }[] = []

    for (const node of tree.children) {
      if (isHeading(node) && Number(node.tagName[1]) === splitDepth) {
        groups.push({ slug: slugifyHeading(textOf(node)), nodes: [node] })
      } else if (groups.length === 0) {
        preamble.push(node)
      } else {
        groups[groups.length - 1]!.nodes.push(node)
      }
    }

    const selected = sections.flatMap((wanted) => {
      const slug = slugifyHeading(wanted)
      return groups.filter((g) => g.slug === slug).flatMap((g) => g.nodes)
    })

    tree.children = [...preamble, ...selected]
  }
}

/** Drop <img> whose src host isn't allow-listed. Runs after sanitization. */
function stripDisallowedImages(html: string): string {
  return html.replace(/<img\b[^>]*\bsrc="([^"]*)"[^>]*>/gi, (tag, src) => {
    try {
      const host = new URL(src).hostname
      return IMG_ALLOW_HOSTS.includes(host) ? tag : ""
    } catch {
      return ""
    }
  })
}
