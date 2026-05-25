# Subdomain Personalisation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users type their subdomain name once and have `yourname` replaced everywhere in docs code blocks, persisted to localStorage.

**Architecture:** A Zustand store holds the name (default `"yourname"`, persisted to localStorage). Custom `pre` and `code` MDX component overrides walk React children and replace `yourname` text at render time. A `<SubdomainInput />` component is embeddable in MDX pages.

**Tech Stack:** Zustand, React 19, Next.js 16 App Router, fumadocs-ui 16, TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/docs/src/store/subdomain.ts` | Create | Zustand store + localStorage persistence |
| `apps/docs/src/components/subdomain-input.tsx` | Create | Input widget for MDX embeds (`'use client'`) |
| `apps/docs/src/components/subdomain-code.tsx` | Create | Custom `pre`/`code` with substitution (`'use client'`) |
| `apps/docs/src/components/mdx.tsx` | Modify | Register all custom components (stays server-compatible) |

---

### Task 1: Install Zustand

**Files:**
- Modify: `apps/docs/package.json`

- [ ] **Step 1: Install Zustand in the docs app**

```bash
cd apps/docs && pnpm add zustand
```

Expected output: `+ zustand X.X.X` in the install summary.

- [ ] **Step 2: Verify install**

```bash
node -e "require('zustand')" && echo "ok"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add apps/docs/package.json pnpm-lock.yaml
git commit -m "chore(docs): install zustand"
```

---

### Task 2: Create the subdomain store

**Files:**
- Create: `apps/docs/src/store/subdomain.ts`

- [ ] **Step 1: Create the store file**

```typescript
// apps/docs/src/store/subdomain.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SubdomainStore {
  name: string
  setName: (name: string) => void
}

const VALID = /^[a-z0-9-]{1,63}$/

export const useSubdomainStore = create<SubdomainStore>()(
  persist(
    (set) => ({
      name: 'yourname',
      setName: (name) => {
        if (name === '' || VALID.test(name)) {
          set({ name: name || 'yourname' })
        }
      },
    }),
    { name: 'ispinoydev-subdomain' }
  )
)
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/docs && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/store/subdomain.ts
git commit -m "feat(docs): add subdomain zustand store with localStorage persistence"
```

---

### Task 3: Create the SubdomainInput component

**Files:**
- Create: `apps/docs/src/components/subdomain-input.tsx`

- [ ] **Step 1: Create the component**

```tsx
// apps/docs/src/components/subdomain-input.tsx
'use client'

import { useSubdomainStore } from '@/store/subdomain'
import { useEffect, useRef, useState } from 'react'

export function SubdomainInput() {
  const { name, setName } = useSubdomainStore()
  const [draft, setDraft] = useState(name === 'yourname' ? '' : name)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (name !== 'yourname') setDraft(name)
  }, [name])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase()
    setDraft(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setName(val), 300)
  }

  const display = draft || 'yourname'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        border: '3px solid #F5C800',
        boxShadow: '4px 4px 0 #FAFAF5',
        maxWidth: '480px',
        margin: '1.5rem 0',
        fontFamily: 'var(--font-mono)',
        fontSize: '13px',
      }}
    >
      <input
        type="text"
        value={draft}
        onChange={handleChange}
        placeholder="yourname"
        maxLength={63}
        spellCheck={false}
        autoCapitalize="none"
        autoCorrect="off"
        style={{
          flex: 1,
          backgroundColor: '#0D0D0D',
          color: '#FAFAF5',
          border: 'none',
          padding: '12px 16px',
          outline: 'none',
          caretColor: '#F5C800',
          fontFamily: 'inherit',
          fontSize: 'inherit',
        }}
      />
      <div
        style={{
          backgroundColor: '#0D0D0D',
          color: '#3A3A3A',
          padding: '12px 12px 12px 0',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        .is-pinoy.dev
      </div>
      <div style={{ width: '3px', backgroundColor: '#F5C800' }} />
      <div
        style={{
          backgroundColor: '#1A1A1A',
          color: '#888888',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          fontFamily: 'var(--font-pixel)',
          fontSize: '9px',
          letterSpacing: '0.05em',
        }}
      >
        {display}.is-pinoy.dev
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/docs && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/components/subdomain-input.tsx
git commit -m "feat(docs): add SubdomainInput MDX component"
```

---

### Task 4: Create subdomain-code.tsx with pre/code client components

**Files:**
- Create: `apps/docs/src/components/subdomain-code.tsx`

- [ ] **Step 1: Create the file**

```tsx
// apps/docs/src/components/subdomain-code.tsx
'use client'

import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock'
import React from 'react'
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

export function CustomPre({ children, ...props }: React.ComponentProps<'pre'>) {
  const name = useSubdomainStore((s) => s.name)
  const replaced = replaceYourname(children, name)
  return (
    <CodeBlock {...props}>
      <Pre>{replaced}</Pre>
    </CodeBlock>
  )
}

export function CustomCode({ children, ...props }: React.ComponentProps<'code'>) {
  const name = useSubdomainStore((s) => s.name)
  const replaced = replaceYourname(children, name)
  return <code {...props}>{replaced}</code>
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/docs && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/docs/src/components/subdomain-code.tsx
git commit -m "feat(docs): add client-side pre/code substitution components"
```

---

### Task 5: Register all custom components in mdx.tsx

**Files:**
- Modify: `apps/docs/src/components/mdx.tsx`

- [ ] **Step 1: Replace the full content of mdx.tsx**

```tsx
// apps/docs/src/components/mdx.tsx
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { Steps, Step } from 'fumadocs-ui/components/steps'
import { Tabs, Tab } from 'fumadocs-ui/components/tabs'
import type { MDXComponents } from 'mdx/types'
import { SubdomainInput } from './subdomain-input'
import { CustomPre, CustomCode } from './subdomain-code'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Steps,
    Step,
    Tabs,
    Tab,
    SubdomainInput,
    pre: CustomPre,
    code: CustomCode,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/docs && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Build to confirm no runtime errors**

```bash
cd apps/docs && pnpm build 2>&1 | tail -20
```

Expected: build succeeds, no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/src/components/mdx.tsx
git commit -m "feat(docs): register SubdomainInput and custom pre/code in getMDXComponents"
```

---

### Task 6: Embed SubdomainInput in the workflow index page

**Files:**
- Modify: `apps/docs/content/docs/register/workflow/index.mdx`

- [ ] **Step 1: Read the current workflow index**

```bash
cat apps/docs/content/docs/register/workflow/index.mdx
```

- [ ] **Step 2: Add the SubdomainInput below the intro paragraph**

Open `apps/docs/content/docs/register/workflow/index.mdx` and add `<SubdomainInput />` after the first paragraph (before the step map table):

```mdx
Registration takes about 10 minutes for a first-time contributor.

<SubdomainInput />

## Step map
```

- [ ] **Step 3: Start the dev server and verify**

```bash
cd apps/docs && pnpm dev
```

Open http://localhost:3000/register/workflow in a browser. You should see the gold-bordered input. Type a name — all code blocks on any workflow page should update live.

- [ ] **Step 4: Commit**

```bash
git add apps/docs/content/docs/register/workflow/index.mdx
git commit -m "feat(docs): embed SubdomainInput in workflow index"
```
