import type { MetadataRoute } from "next"
import { getRenderContext } from "@/lib/context"
import { fallbackManifest, manifestFor } from "@/lib/seo"

export const dynamic = "force-dynamic"

/**
 * The install manifest, per portfolio. "Add to Home Screen" on a claimed
 * subdomain should produce the owner's site under the owner's name, icon and
 * background — not a bookmark named after our renderer.
 *
 * Previews and the renderer host get the brand manifest: they are not anybody's
 * installable site, and `display: browser` keeps them from pretending otherwise.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const ctx = await getRenderContext()
  if (!ctx || !ctx.subdomain) return fallbackManifest()

  return manifestFor({
    data: ctx.data,
    template: ctx.template,
    theme: ctx.theme,
  })
}
