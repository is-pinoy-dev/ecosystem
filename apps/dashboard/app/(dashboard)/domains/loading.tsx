import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"

import { PageHeaderSkeleton } from "@/components/page-header"

function DomainRowSkeleton() {
  return (
    <section className="flex flex-wrap items-center gap-4 border border-border p-4 sm:flex-nowrap">
      <Skeleton className="size-10 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-56 max-w-[70vw]" />
        <Skeleton className="h-3 w-80 max-w-full" />
      </div>
      <div className="ml-auto flex gap-2">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-20" />
      </div>
    </section>
  )
}

export default function DomainsLoading() {
  return (
    <div
      className="flex max-w-5xl flex-col gap-8"
      role="status"
      aria-label="Loading domains"
    >
      <PageHeaderSkeleton titleWidth="w-56" descriptionLines={2} />

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-3 divide-x divide-border border-y border-border py-3">
          {["domains", "active", "changes"].map((label) => (
            <div key={label} className="flex flex-col gap-2 px-5 first:pl-0">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="h-7 w-8" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <DomainRowSkeleton />
          <DomainRowSkeleton />
          <DomainRowSkeleton />
        </div>
      </div>

      <span className="sr-only">Loading your domains…</span>
    </div>
  )
}
