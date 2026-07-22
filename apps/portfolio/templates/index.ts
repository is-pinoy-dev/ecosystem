import { createElement, type ComponentType, type ReactElement } from "react"
import type { PortfolioConfig } from "@is-pinoy-dev/schemas"
import type { PortfolioData } from "@/lib/portfolio-data"
import { TerminalTemplate } from "./terminal"
import { PixelCardTemplate } from "./pixel-card"
import { MinimalTemplate } from "./minimal"

export type TemplateName = NonNullable<PortfolioConfig>["template"]
export type PortfolioTheme = NonNullable<NonNullable<PortfolioConfig>["theme"]>

export interface TemplateProps {
  data: PortfolioData
}

// Registry: schema `template` enum → component. Theme is handled by the shell,
// so templates only take `data`. Adding a template is one entry here plus one
// enum value in @is-pinoy-dev/schemas — no routing changes.
const TEMPLATES: Record<TemplateName, ComponentType<TemplateProps>> = {
  terminal: TerminalTemplate,
  "pixel-card": PixelCardTemplate,
  minimal: MinimalTemplate,
}

/** Render the template named in a subdomain's portfolio config. */
export function renderTemplate(
  name: TemplateName,
  props: TemplateProps,
): ReactElement {
  const Template = TEMPLATES[name] ?? TerminalTemplate
  return createElement(Template, props)
}
