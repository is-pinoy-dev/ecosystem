// apps/docs/src/components/subdomain-code.tsx
'use client'

import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import React, { useMemo } from 'react'
import { useSubdomainStore } from '@/store/subdomain'

export function replaceYourname(children: React.ReactNode, name: string): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string') {
      return child.replaceAll('yourname', name)
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.props.children) {
      return React.cloneElement(child, {
        ...child.props,
        children: replaceYourname(child.props.children, name),
      })
    }
    return child
  })
}

export function CustomPre({ children, 'data-title': title, ...props }: React.ComponentProps<'pre'> & { 'data-title'?: string }) {
  const name = useSubdomainStore((s) => s.name)
  const replaced = useMemo(() => replaceYourname(children, name), [children, name])
  return (
    <CodeBlock title={title} {...props}>
      <Pre>{replaced}</Pre>
    </CodeBlock>
  )
}

export function CustomCode({ children, ...props }: React.ComponentProps<'code'>) {
  const name = useSubdomainStore((s) => s.name)
  const replaced = useMemo(() => replaceYourname(children, name), [children, name])
  return <code {...props}>{replaced}</code>
}
