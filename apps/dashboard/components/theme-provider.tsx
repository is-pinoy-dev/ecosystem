"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// Banig Grid v2 is light-first: dark stays available as a preference via the
// header toggle, but the brand presentation defaults to the light theme.
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
