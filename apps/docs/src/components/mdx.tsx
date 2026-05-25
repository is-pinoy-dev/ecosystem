// apps/docs/src/components/mdx.tsx
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Steps, Step } from 'fumadocs-ui/components/steps'
import { Tabs, Tab } from 'fumadocs-ui/components/tabs'
import type { MDXComponents } from 'mdx/types'
import { CustomPre, CustomCode } from './subdomain-code'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Steps,
    Step,
    Tabs,
    Tab,
    pre: CustomPre,
    code: CustomCode,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
