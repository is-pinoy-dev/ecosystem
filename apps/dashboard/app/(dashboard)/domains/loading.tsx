import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"
import { PageHeaderSkeleton } from "@/components/page-header"

// DNS values vary in length; cycling widths keeps the placeholder table from
// reading as a stack of identical full-width slabs.
const VALUE_WIDTHS = ["w-64", "w-96", "w-48", "w-80"]

/** Mirrors one `DomainSection`: header row, then a ruled record table. */
function DomainSectionSkeleton({ records }: { records: number }) {
  return (
    <section className="flex flex-col border-t border-border pt-5 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="flex min-w-0 items-center gap-2.5">
          <Skeleton className="size-2 shrink-0" />
          <Skeleton className="h-5 w-56 max-w-[60vw]" />
        </span>
        <span className="flex flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1">
          <Skeleton className="h-3 w-52 max-w-full" />
          <Skeleton className="h-3.5 w-20" />
        </span>
      </div>

      <ul className="m-0 mt-3 mb-2 list-none p-0">
        {Array.from({ length: records }, (_, index) => (
          <li
            key={index}
            className="flex min-h-10 flex-wrap items-center gap-x-4 gap-y-1 border-b border-border/70 py-2 last:border-b-0"
          >
            <Skeleton className="h-5 w-16 shrink-0" />
            <Skeleton
              className={`h-3.5 min-w-0 max-w-full ${VALUE_WIDTHS[index % VALUE_WIDTHS.length]}`}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function DomainsLoading() {
  return (
    <div className="flex flex-col gap-8" role="status" aria-label="Loading domains">
      <PageHeaderSkeleton titleWidth="w-56" descriptionLines={2} />

      <div className="flex flex-col gap-5">
        <DomainSectionSkeleton records={3} />
        <DomainSectionSkeleton records={2} />
        <DomainSectionSkeleton records={1} />
      </div>

      <span className="sr-only">Loading your domains…</span>
    </div>
  )
}
