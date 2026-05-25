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
