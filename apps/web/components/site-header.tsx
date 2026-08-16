import { Container } from "@is-pinoy-dev/ui/components/container"
import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"
import { BrandLink } from "@/components/brand-link"
import { MainNav } from "@/components/main-nav"
import { resolveFlagSet } from "@/lib/flags-server"

/**
 * The one place feature flags are read for the public site's chrome.
 *
 * It lives in the root layout, which client navigation never re-renders, so the
 * flags resolve once per full page load rather than once per route change — and
 * the header keeps its DOM, its scroll position, and its GitHub star count
 * across navigations instead of re-mounting on every click.
 */
export async function SiteHeader() {
  const flags = await resolveFlagSet()

  return <MainNav flags={flags} />
}

/**
 * Shown while the flags resolve. Deliberately close to the real thing: the same
 * frame at the same height so nothing below it moves when the header arrives,
 * the real brand mark rather than a placeholder for it, and grey blocks only
 * where the flag-dependent menu actually goes.
 */
export function SiteHeaderSkeleton() {
  return (
    <nav className="sticky top-0 z-50 h-[60px] border-b border-border bg-background/98 lg:h-16">
      <Container className="flex h-full items-center justify-between gap-6">
        <BrandLink />

        <div className="hidden items-center gap-2 lg:flex" aria-hidden="true">
          <Skeleton className="h-4 w-[68px]" />
          <Skeleton className="h-4 w-[52px]" />
          <Skeleton className="h-4 w-[76px]" />
          <Skeleton className="h-4 w-[92px]" />
        </div>

        <div className="flex items-center gap-1 lg:gap-2" aria-hidden="true">
          <Skeleton className="size-9" />
          <Skeleton className="hidden h-9 w-[104px] lg:block" />
          <Skeleton className="hidden h-10 w-[132px] lg:block" />
          <Skeleton className="size-11 lg:hidden" />
        </div>
      </Container>
    </nav>
  )
}
