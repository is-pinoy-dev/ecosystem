import { Separator } from "@is-pinoy-dev/ui/components/separator"
import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"
import { PageHeaderSkeleton } from "@/components/page-header"

/** Mirrors the stat cell in `page.tsx`. */
function StatSkeleton() {
  return (
    <div className="flex flex-col gap-1.5 py-5 sm:px-8 sm:first:pl-0 sm:last:pr-0">
      <Skeleton className="h-3 w-28" />
      <Skeleton className="h-9 w-12" />
    </div>
  )
}

/** Mirrors a `DomainRows` row. */
function DomainRowSkeleton() {
  return (
    <li className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border py-3">
      <span className="flex min-w-0 items-center gap-2.5">
        <Skeleton className="size-2 shrink-0" />
        <Skeleton className="h-4 w-44 max-w-[50vw]" />
      </span>
      <span className="flex flex-1 items-center justify-end gap-2">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-5 w-12" />
        <Skeleton className="size-8" />
      </span>
    </li>
  )
}

/** Mirrors a link row in the sidebar resource list. */
function ResourceRowSkeleton() {
  return (
    <li className="flex min-h-11 items-center justify-between gap-3 border-b border-border py-2.5">
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="h-3 w-40 max-w-full" />
      </span>
      <Skeleton className="size-3.5 shrink-0" />
    </li>
  )
}

export default function OverviewLoading() {
  return (
    <div className="flex flex-col gap-10" role="status" aria-label="Loading overview">
      <PageHeaderSkeleton titleWidth="w-72" />

      <div className="grid border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-border max-sm:divide-y max-sm:divide-border">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-14">
        <section className="flex min-w-0 flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <ul className="m-0 list-none border-t border-border p-0">
            <DomainRowSkeleton />
            <DomainRowSkeleton />
            <DomainRowSkeleton />
          </ul>
        </section>

        <aside className="flex min-w-0 flex-col gap-6 lg:border-l lg:border-border lg:pl-8">
          <section className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 shrink-0" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-3 w-40 max-w-full" />
            <Skeleton className="h-3.5 w-28" />
          </section>

          <Separator />

          <section className="flex flex-col gap-3">
            <Skeleton className="h-3 w-20" />
            <ul className="m-0 flex list-none flex-col p-0">
              <ResourceRowSkeleton />
              <ResourceRowSkeleton />
              <ResourceRowSkeleton />
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <Skeleton className="h-3 w-36" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-8 w-48 self-start" />
          </section>
        </aside>
      </div>

      <span className="sr-only">Loading your dashboard overview…</span>
    </div>
  )
}
