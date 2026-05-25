// apps/docs/src/components/subdomain-code.tsx
'use client'

import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import React, { useMemo } from 'react'
import { EditableSubdomain } from './editable-subdomain'

export function injectEditableSubdomain(children: React.ReactNode): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (typeof child === 'string' && child.includes('yourname')) {
      const parts = child.split('yourname')
      return parts.flatMap((part, i) =>
        i < parts.length - 1
          ? [part, <EditableSubdomain key={i} />]
          : [part]
      )
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.props.children) {
      return React.cloneElement(child, {
        ...child.props,
        children: injectEditableSubdomain(child.props.children),
      })
    }
    return child
  })
}

export function CustomPre({ children, 'data-title': title, ...props }: React.ComponentProps<'pre'> & { 'data-title'?: string }) {
  const injected = useMemo(() => injectEditableSubdomain(children), [children])
  return (
    <CodeBlock title={title} {...props}>
      <Pre>{injected}</Pre>
    </CodeBlock>
  )
}

export function CustomCode({ children, ...props }: React.ComponentProps<'code'>) {
  const injected = useMemo(() => injectEditableSubdomain(children), [children])
  return <code {...props}>{injected}</code>
}
