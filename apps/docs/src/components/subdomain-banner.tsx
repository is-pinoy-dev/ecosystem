'use client'

import { useState, useRef } from 'react'
import { useSubdomainStore } from '@/store/subdomain'

export function SubdomainBanner() {
  const { name, setName } = useSubdomainStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const isDefault = name === 'yourname'

  const startEdit = () => {
    setDraft(isDefault ? '' : name)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commit = () => {
    setName(draft)
    setEditing(false)
  }

  const cancel = () => setEditing(false)

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 mb-6 border border-fd-border bg-fd-muted/40 text-sm font-mono"
      style={{ borderLeft: '3px solid #F5C800' }}
    >
      <span style={{ color: '#F5C800', fontSize: '10px' }}>▶</span>
      <span className="text-fd-muted-foreground text-xs">
        {isDefault ? 'Set your subdomain to personalise all badges:' : 'Showing badges for:'}
      </span>

      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.toLowerCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          onBlur={commit}
          placeholder="yourname"
          maxLength={63}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          className="text-xs font-mono bg-transparent outline-none"
          style={{
            border: 'none',
            borderBottom: '1px solid #F5C800',
            color: '#F5C800',
            caretColor: '#F5C800',
            minWidth: '8ch',
            width: `${Math.max((draft.length || 8), 8)}ch`,
          }}
        />
      ) : (
        <button
          onClick={startEdit}
          title="Click to change your subdomain"
          className="text-xs font-mono bg-transparent border-none cursor-text p-0 flex items-center gap-1"
          style={{
            color: '#F5C800',
            borderBottom: '1px dashed #F5C800',
          }}
        >
          {name}
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ opacity: 0.6 }}>
            <path d="M7 1L9 3L3.5 8.5H1.5V6.5L7 1Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      <span className="text-fd-muted-foreground text-xs opacity-50">.is-pinoy.dev</span>
    </div>
  )
}
