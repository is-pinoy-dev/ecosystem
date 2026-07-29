import { z } from "zod"
import { THEMEABLE_TOKENS } from "./tokens.js"

/**
 * A community theme's `theme.json`, as authored in `is-pinoy-dev/community`.
 *
 * Token *values* are typed as plain strings here on purpose. Zod validates the
 * shape; `compile.ts` validates the values through `parseColor`, so there is
 * exactly one place that decides what a safe value is. Splitting that across
 * two layers is how the two drift.
 */

// `@<github-username>/<slug>`, matching the domain schema's theme reference.
const THEME_ID =
  /^@[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}\/[a-z0-9]+(?:-[a-z0-9]+)*$/

const SEMVER_EXACT =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/

const tokensSchema = z
  .object(
    Object.fromEntries(
      THEMEABLE_TOKENS.map((t) => [t, z.string().optional()]),
    ) as Record<(typeof THEMEABLE_TOKENS)[number], z.ZodOptional<z.ZodString>>,
  )
  .strict()

export const themeManifestSchema = z.object({
  id: z.string().regex(THEME_ID, "Theme id must look like @github-username/theme-name"),
  version: z
    .string()
    .regex(SEMVER_EXACT, "Pin an exact version, e.g. 1.2.0 — ranges are not allowed"),
  title: z.string().min(1).max(60),
  description: z.string().max(200).optional(),
  author: z.object({
    github: z.string().regex(/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/),
  }),
  license: z.string().min(1).max(40),
  // Which base the token overrides sit on. A theme that only sets --primary
  // inherits the rest from here, exactly as the built-in `mono` does today.
  base: z.enum(["dark", "light"]).default("dark"),
  tokens: tokensSchema,
})

export type ThemeManifest = z.infer<typeof themeManifestSchema>

/** The compiled, servable form. This is what the renderer consumes. */
export interface CompiledTheme {
  id: string
  version: string
  title: string
  description?: string
  author: { github: string }
  license: string
  base: "dark" | "light"
  /** Ready-to-inject CSS. Already scoped; safe to place in a <style>. */
  css: string
  /** sha256 of `css`, hex. Identifies the artifact independently of the manifest. */
  hash: string
}
