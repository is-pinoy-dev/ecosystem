import type { Metadata } from "next"
import { SITE_NAME } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Not found — ${SITE_NAME}`,
  description: `No portfolio is claimed at this address. Claim a free subdomain at ${SITE_NAME}.`,
  robots: { index: false, follow: false },
  // The layout's brand icons apply; a 404 belongs to us, not to an owner.
}

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="m-0 font-mono text-lg text-primary">404</h1>
      <p className="m-0 text-sm text-muted-foreground">
        No portfolio is claimed at this address. Claim one at{" "}
        <a
          href={`https://${SITE_NAME}`}
          className="text-accent underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {SITE_NAME}
        </a>
        .
      </p>
    </main>
  )
}
