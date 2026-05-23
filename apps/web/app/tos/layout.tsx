import type { Metadata } from "next"
import { DocLayout } from "@/components/doc-layout"

export const metadata: Metadata = {
  title: "Terms of Service | is-pinoy.dev",
  description: "Terms of Service for the is-pinoy.dev free subdomain service.",
}

export default function TosLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocLayout title="Terms of Service" effectiveDate="May 23, 2026">
      {children}
    </DocLayout>
  )
}
