import type { Metadata } from "next"
import { DocLayout } from "@/components/doc-layout"

export const metadata: Metadata = {
  title: "Privacy Policy | is-pinoy.dev",
  description: "Privacy Policy for the is-pinoy.dev free subdomain service.",
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocLayout title="Privacy Policy" effectiveDate="May 23, 2026">
      {children}
    </DocLayout>
  )
}
