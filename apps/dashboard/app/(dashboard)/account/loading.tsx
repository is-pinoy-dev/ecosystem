import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"
import { PageHeaderSkeleton } from "@/components/page-header"

/** Mirrors a label / value row in the account detail list. */
function DetailRowSkeleton({ valueWidth }: { valueWidth: string }) {
  return (
    <li className="grid min-h-12 items-center gap-x-6 gap-y-2 border-b border-border py-3 sm:grid-cols-[180px_1fr]">
      <Skeleton className="h-3 w-28" />
      <Skeleton className={`h-3.5 max-w-full ${valueWidth}`} />
    </li>
  )
}

export default function AccountLoading() {
  return (
    <div
      className="flex max-w-[720px] flex-col gap-10"
      role="status"
      aria-label="Loading account"
    >
      <PageHeaderSkeleton titleWidth="w-52" descriptionLines={2} />

      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Skeleton className="size-16 shrink-0" />
          <div className="flex min-w-0 flex-col gap-2.5">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>

        <ul className="m-0 list-none border-t border-border p-0">
          <DetailRowSkeleton valueWidth="w-40" />
          <DetailRowSkeleton valueWidth="w-52" />
          <DetailRowSkeleton valueWidth="w-64" />
          <DetailRowSkeleton valueWidth="w-36" />
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3.5 w-full max-w-[560px]" />
          <Skeleton className="h-3.5 w-2/3 max-w-[420px]" />
        </div>
        <Skeleton className="h-9 w-32" />
      </section>

      <span className="sr-only">Loading your account…</span>
    </div>
  )
}
