import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"
import { PageHeaderSkeleton } from "@/components/page-header"

/** Mirrors a thumbnail card in `ThumbSelector`. */
function ThumbCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden border border-border bg-card">
      <Skeleton className="aspect-[16/10] w-full border-b border-border" />
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-4 w-12" />
      </div>
    </div>
  )
}

/** Mirrors a `ThumbSelector` fieldset: legend, hint, then a card grid. */
function ThumbSelectorSkeleton({ options }: { options: number }) {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-3.5 w-48" />
      <Skeleton className="h-3 w-64 max-w-full" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: options }, (_, index) => (
          <ThumbCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export default function ClaimLoading() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Loading claim form">
      <PageHeaderSkeleton titleWidth="w-80" descriptionLines={3} />

      <div className="flex flex-col gap-8">
        {/* Subdomain field */}
        <div className="flex flex-col gap-3">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-12 w-full max-w-xl" />
          <Skeleton className="h-3 w-72 max-w-full" />
        </div>

        {/* "Choose a style" intro */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-full max-w-[540px]" />
          <Skeleton className="h-3 w-2/3 max-w-[380px]" />
        </div>

        {/* Style tabs — the "Layout + color" tab is the one that opens first */}
        <div className="flex flex-col gap-5">
          <div className="flex border-b border-border">
            <span className="flex min-h-11 items-center pr-4">
              <Skeleton className="h-4 w-28" />
            </span>
            <span className="flex min-h-11 items-center px-4">
              <Skeleton className="h-4 w-28" />
            </span>
          </div>

          <div className="flex flex-col gap-4">
            <ThumbSelectorSkeleton options={3} />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3.5 w-16" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton key={index} className="h-9 w-28" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <Skeleton className="h-3 w-full max-w-[520px]" />

        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      </div>

      <span className="sr-only">Loading the claim form…</span>
    </div>
  )
}
