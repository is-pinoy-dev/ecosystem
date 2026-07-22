import type { ReactNode } from "react"
import type { PortfolioTheme } from "@/templates"
import { PortfolioFooter } from "./portfolio-footer"

// Owns everything a template shouldn't care about: the theme boundary (the
// [data-theme] element that re-scopes the design tokens), the page background,
// and the shared footer. Templates render only their content and inherit the
// active theme's colors through the cascading tokens.
export function PortfolioShell({
  theme = "gold-dark",
  login,
  children,
}: {
  theme?: PortfolioTheme
  login: string
  children: ReactNode
}) {
  return (
    <div
      data-theme={theme}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <div className="flex-1">{children}</div>
      <PortfolioFooter login={login} />
    </div>
  )
}
