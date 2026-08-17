"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Shared theme provider for the React Router tools (site-audit, og), which have
// no framework-level provider of their own. Same wiring as the website and the
// dashboard so AnimatedThemeToggler behaves identically everywhere.
//
// Banig Grid v2 is light-first: dark stays available as a preference via the
// toggler, but the brand presentation defaults to the light theme.
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
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}

export { ThemeProvider }
