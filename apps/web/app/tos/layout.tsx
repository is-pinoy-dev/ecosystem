import type { Metadata } from "next"
import { DocLayout } from "@/components/doc-layout"

export const metadata: Metadata = {
  title: "Terms of Service | is-pinoy.dev",
  description:
    "The rules for claiming and using free is-pinoy.dev subdomains responsibly.",
  openGraph: {
    title: "Terms of Service | is-pinoy.dev",
    description:
      "Review the community rules for claiming and using free is-pinoy.dev subdomains responsibly.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "is-pinoy.dev — Free subdomains for Filipino developers.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | is-pinoy.dev",
    description:
      "Review the community rules for claiming and using free is-pinoy.dev subdomains responsibly.",
    images: ["/opengraph-image"],
  },
}
export default function TosLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocLayout title="Terms of Service" effectiveDate="May 28, 2026">
      {children}
    </DocLayout>
  )
}
