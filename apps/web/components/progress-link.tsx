"use client"

import { useEffect } from "react"
import Link, { useLinkStatus } from "next/link"
import { navProgress } from "@/lib/nav-progress"

/**
 * Reports its enclosing link's pending state into the shared store.
 *
 * Renders nothing, and has to: `useLinkStatus` only reads a status when it is
 * called from inside a `next/link`, so this must be a child of the anchor — and
 * an anchor's layout must not shift to make room for it.
 */
function LinkPendingBridge() {
  const { pending } = useLinkStatus()

  useEffect(() => {
    if (!pending) return
    navProgress.start()
    // Cleanup covers both endings: `pending` going false when the navigation
    // commits, and this link's own page unmounting underneath it — which is
    // that same commit seen from the other side.
    return () => navProgress.done()
  }, [pending])

  return null
}

/**
 * `next/link` with route-transition feedback wired in.
 *
 * Use it for links to routes inside this app. External destinations stay plain
 * `<a>` tags — there is no client navigation to report on — and a link to an
 * anchor on the page you are already reading never goes pending, so the bar
 * correctly stays down for `/#claim` pressed from the landing page.
 */
export function ProgressLink({
  children,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <LinkPendingBridge />
    </Link>
  )
}
