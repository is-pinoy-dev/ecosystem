import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Steps, Step } from 'fumadocs-ui/components/steps'
import { Tabs, Tab } from 'fumadocs-ui/components/tabs'
import type { MDXComponents } from 'mdx/types'
import { CustomPre, CustomCode } from './subdomain-code'
import { BadgePreview } from './badge-preview'
import { BadgeThemes } from './badge-themes'
import { SubdomainBanner } from './subdomain-banner'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Steps,
    Step,
    Tabs,
    Tab,
    pre: CustomPre,
    code: CustomCode,
    BadgePreview,
    BadgeThemes,
    SubdomainBanner,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
