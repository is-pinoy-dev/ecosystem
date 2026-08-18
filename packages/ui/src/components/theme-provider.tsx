"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Shared theme provider for the React Router tools (site-audit, og), which have
// no framework-level provider of their own. Same wiring as the website and the
// dashboard so AnimatedThemeToggler behaves identically everywhere.
//
// Defaults to dark, matching the website — a visitor arriving at a tool from
// is-pinoy.dev lands on the same presentation. Light stays a click away on the
// toggler, and the choice persists per origin.
//
// The host must set `suppressHydrationWarning` on <html> — next-themes writes
// the class on the document before React hydrates.
function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
