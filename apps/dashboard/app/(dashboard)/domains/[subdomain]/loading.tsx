import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"

export default function DomainDetailLoading() {
  return (
    <div
      className="flex max-w-5xl flex-col gap-8"
      role="status"
      aria-label="Loading domain details"
    >
      <Skeleton className="h-4 w-24" />
      <div className="flex flex-wrap items-start gap-4">
        <Skeleton className="size-11" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-3 w-48" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-72 w-full" />
      <span className="sr-only">Loading domain details…</span>
    </div>
  )
}
