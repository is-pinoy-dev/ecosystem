import { DocLayout } from "@/components/doc-layout"

export default function TosLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocLayout title="Terms of Service" effectiveDate="May 23, 2026">
      {children}
    </DocLayout>
  )
}
