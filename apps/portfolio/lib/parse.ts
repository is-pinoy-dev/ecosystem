import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeStringify from "rehype-stringify"
import type { Schema } from "hast-util-sanitize"

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

const schema: Schema = {
  ...defaultSchema,
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
 */
export async function renderReadme(markdown: string): Promise<string> {
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
    .use(rehypeStringify)
    .process(markdown)

  return stripDisallowedImages(String(file))
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
