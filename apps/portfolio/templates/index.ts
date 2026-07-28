import { createElement, type ComponentType, type ReactElement } from "react"
import {
  DESIGNER_TEMPLATES as DESIGNER_TEMPLATE_NAMES,
  type PortfolioTemplate,
  type BuiltinTheme,
} from "@is-pinoy-dev/schemas"
import type { PortfolioData } from "@/lib/portfolio-data"
import { TerminalTemplate } from "./terminal"
import { PixelCardTemplate } from "./pixel-card"
import { MinimalTemplate } from "./minimal"
import { ConcreteDesign } from "./designer/concrete"
import { BroadsheetDesign } from "./designer/broadsheet"
import { PhosphorDesign } from "./designer/phosphor"
import { DraftDesign } from "./designer/draft"
import { BubblegumDesign } from "./designer/bubblegum"
import { GridDesign } from "./designer/grid"

export type TemplateName = PortfolioTemplate

/**
 * The themes the shell can actually apply.
 *
 * `portfolio.theme` in the schema is a union — a built-in name, or a pinned
 * community theme. Only the built-ins are a `[data-theme]` switch over tokens
 * that already ship in the CSS; a community theme has to be fetched and
 * compiled first (P1), so it is deliberately not part of this type. See
 * `resolveTheme` in lib/context.ts for how the union narrows to it.
 */
export type PortfolioTheme = BuiltinTheme

export interface TemplateProps {
  data: PortfolioData
}

type DesignerTemplateName = (typeof DESIGNER_TEMPLATE_NAMES)[number]

// "Layout" templates are styled by the color `theme` via the shared shell.
// "Designer" templates are complete, self-contained designs (own layout, type,
// color, light/dark) — they ignore `theme` and render their own full page, so
// the renderer skips the theme shell for them (see isDesignerTemplate).
const LAYOUT_TEMPLATES: Record<string, ComponentType<TemplateProps>> = {
  terminal: TerminalTemplate,
  "pixel-card": PixelCardTemplate,
  minimal: MinimalTemplate,
}

// Typed by the schema's designer list rather than `string`, so adding a name
// there without adding a component here (or vice versa) is a compile error
// instead of a silent fall-through to the terminal template.
const DESIGNER_TEMPLATES: Record<
  DesignerTemplateName,
  ComponentType<TemplateProps>
> = {
  concrete: ConcreteDesign,
  broadsheet: BroadsheetDesign,
  phosphor: PhosphorDesign,
  draft: DraftDesign,
  bubblegum: BubblegumDesign,
  grid: GridDesign,
}

const TEMPLATES: Record<string, ComponentType<TemplateProps>> = {
  ...LAYOUT_TEMPLATES,
  ...DESIGNER_TEMPLATES,
}

/** Designer templates bring their own full-page look and skip the theme shell. */
export function isDesignerTemplate(name: TemplateName): boolean {
  return name in DESIGNER_TEMPLATES
}

/** Render the template named in a subdomain's portfolio config. */
export function renderTemplate(
  name: TemplateName,
  props: TemplateProps,
): ReactElement {
  const Template = TEMPLATES[name] ?? TerminalTemplate
  return createElement(Template, props)
}
