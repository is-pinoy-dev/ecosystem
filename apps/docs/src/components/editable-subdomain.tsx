'use client'

import React, { useRef, useState } from 'react'

import { useSubdomainStore } from '@/store/subdomain'

export function EditableSubdomain() {
  const { name, setName } = useSubdomainStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [hovered, setHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const display = name === 'yourname' ? 'yourname' : name

  const startEdit = () => {
    setDraft(name === 'yourname' ? '' : name)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commit = () => {
    setName(draft)
    setEditing(false)
  }

  const cancel = () => setEditing(false)

  if (editing) {
    return (
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
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid #F5C800',
          color: 'inherit',
          font: 'inherit',
          outline: 'none',
          padding: '0',
          width: `${Math.max(draft.length || 8, 8)}ch`,
          caretColor: '#F5C800',
        }}
      />
    )
  }

  return (
    <button
      onClick={startEdit}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title="Click to personalise"
      style={{
        background: 'transparent',
        border: 'none',
        borderBottom: '1px dashed #F5C800',
        color: '#F5C800',
        cursor: 'text',
        font: 'inherit',
        padding: '0',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25em',
      }}
    >
      {display}
      {hovered && (
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          data-editable-subdomain-icon
          style={{ opacity: 0.7, flexShrink: 0 }}
        >
          <path
            d="M7 1L9 3L3.5 8.5H1.5V6.5L7 1Z"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
