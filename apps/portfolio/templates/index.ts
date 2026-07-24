import { createElement, type ComponentType, type ReactElement } from "react"
import type { PortfolioConfig } from "@is-pinoy-dev/schemas"
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

export type TemplateName = NonNullable<PortfolioConfig>["template"]
export type PortfolioTheme = NonNullable<NonNullable<PortfolioConfig>["theme"]>

export interface TemplateProps {
  data: PortfolioData
}

// "Layout" templates are styled by the color `theme` via the shared shell.
// "Designer" templates are complete, self-contained designs (own layout, type,
// color, light/dark) — they ignore `theme` and render their own full page, so
// the renderer skips the theme shell for them (see isDesignerTemplate).
const LAYOUT_TEMPLATES: Record<string, ComponentType<TemplateProps>> = {
  terminal: TerminalTemplate,
  "pixel-card": PixelCardTemplate,
  minimal: MinimalTemplate,
}

const DESIGNER_TEMPLATES: Record<string, ComponentType<TemplateProps>> = {
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
