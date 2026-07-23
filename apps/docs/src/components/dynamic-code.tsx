'use client'

import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock'
import type { ThemeRegistrationRaw } from 'shiki'
import isPinoyThemeRaw from '@/shiki-theme.json'

// Runtime-highlighted code (the badge embed snippets, the interactive builder)
// must match the code blocks on every other docs page. The MDX pipeline
// highlights fenced blocks with our custom `is-pinoy-dev` shiki theme
// (see source.config.ts), but `DynamicCodeBlock` defaults to github-light/dark.
// Pass the same theme so the background, font, and token colors line up.
const isPinoyTheme = isPinoyThemeRaw as unknown as ThemeRegistrationRaw

export function DynamicCode({ lang, code }: { lang: string; code: string }) {
  return (
    <DynamicCodeBlock
      lang={lang}
      code={code}
      options={{ themes: { light: isPinoyTheme, dark: isPinoyTheme } }}
    />
  )
}
