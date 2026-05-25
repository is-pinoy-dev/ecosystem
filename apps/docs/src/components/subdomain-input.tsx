'use client'

import { useSubdomainStore } from '@/store/subdomain'
import { useEffect, useRef, useState } from 'react'

export function SubdomainInput() {
  const { name, setName } = useSubdomainStore()
  const [mounted, setMounted] = useState(false)
  const [draft, setDraft] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && name !== 'yourname') setDraft(name)
  }, [mounted, name])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase()
    setDraft(val)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setName(val), 300)
  }

  const display = mounted ? (draft || 'yourname') : 'yourname'

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
