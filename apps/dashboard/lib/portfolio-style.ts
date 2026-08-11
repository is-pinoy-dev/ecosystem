// The portfolio `template` + `theme` pair, as everything outside the record
// file talks about it.
//
// Deliberately free of both `server-only` and React: the picker (client), the
// server action, and the record rewriter in lib/proxy-record.ts all need the
// same two rules — which templates exist, and which of them ignore `theme`.

import {
  PORTFOLIO_DESIGNER_TEMPLATES,
  PORTFOLIO_TEMPLATES,
  PORTFOLIO_THEMES,
} from "@is-pinoy-dev/schemas"

export type PortfolioTemplate = (typeof PORTFOLIO_TEMPLATES)[number]
export type PortfolioTheme = (typeof PORTFOLIO_THEMES)[number]

/** The style a portfolio block expresses, with the palette left off designs. */
export interface PortfolioStyle {
  template: PortfolioTemplate
  theme?: PortfolioTheme
}

const DESIGNER = new Set<string>(PORTFOLIO_DESIGNER_TEMPLATES)

/**
 * A designer template is a complete design — layout, type, and palette — so
 * `theme` means nothing on one. Every writer of the portfolio block drops the
 * palette rather than storing one that will never be read.
 */
export function isDesignerTemplate(template: string): boolean {
  return DESIGNER.has(template)
}

/**
 * The palette a template will actually render with: the chosen one for a
 * layout, nothing for a designer template.
 */
export function effectiveTheme(
  template: string,
  theme: PortfolioTheme | undefined
): PortfolioTheme | undefined {
  return isDesignerTemplate(template) ? undefined : theme
}

/** Do these two styles describe the same rendered portfolio? */
export function sameStyle(a: PortfolioStyle, b: PortfolioStyle): boolean {
  return (
    a.template === b.template &&
    effectiveTheme(a.template, a.theme) === effectiveTheme(b.template, b.theme)
  )
}
