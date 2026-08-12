import type { Metadata } from "next"
import { DocLayout } from "@/components/doc-layout"

export const metadata: Metadata = {
  title: "Privacy Policy | is-pinoy.dev",
  description:
    "How is-pinoy.dev handles data for subdomain claims, validation, abuse reports, and community operations.",
  openGraph: {
    title: "Privacy Policy | is-pinoy.dev",
    description:
      "Read how the community-run is-pinoy.dev service handles data for subdomain claims and operations.",
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
    title: "Privacy Policy | is-pinoy.dev",
    description:
      "Read how the community-run is-pinoy.dev service handles data for subdomain claims and operations.",
    images: ["/opengraph-image"],
  },
}
// The shared header reads feature flags, which needs the request. Declared here
// rather than discovered mid-render so the build says so plainly instead of
// logging a DYNAMIC_SERVER_USAGE bail-out.
export const dynamic = "force-dynamic"

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DocLayout title="Privacy Policy" effectiveDate="August 11, 2026">
      {children}
    </DocLayout>
  )
}
