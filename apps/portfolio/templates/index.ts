import { createElement, type ComponentType, type ReactElement } from "react"
import type { PortfolioConfig } from "@is-pinoy-dev/schemas"
import type { PortfolioData } from "@/lib/portfolio-data"
import { TerminalTemplate } from "./terminal"

export type TemplateName = NonNullable<PortfolioConfig>["template"]
export type PortfolioTheme = NonNullable<
  NonNullable<PortfolioConfig>["theme"]
>

export interface TemplateProps {
  data: PortfolioData
  theme?: PortfolioTheme
}

// Registry: schema `template` enum → component. Adding a template is one entry
// here plus one enum value in @is-pinoy-dev/schemas — no routing changes.
// `pixel-card` and `minimal` are declared in the schema but not yet built, so
// they fall back to terminal for the spike.
const TEMPLATES: Record<TemplateName, ComponentType<TemplateProps>> = {
  terminal: TerminalTemplate,
  "pixel-card": TerminalTemplate,
  minimal: TerminalTemplate,
}

/** Render the template named in a subdomain's portfolio config. */
export function renderTemplate(
  name: TemplateName,
  props: TemplateProps,
): ReactElement {
  const Template = TEMPLATES[name] ?? TerminalTemplate
  return createElement(Template, props)
}
