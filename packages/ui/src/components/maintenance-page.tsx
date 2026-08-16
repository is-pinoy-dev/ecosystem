import { Container } from "@is-pinoy-dev/ui/components/container"

export interface MaintenancePageProps {
  service?: string
}

/** Shared full-page notice shown while a service is temporarily unavailable. */
export function MaintenancePage({
  service = "is-pinoy.dev",
}: MaintenancePageProps) {
  return (
    <main className="flex min-h-screen items-center bg-background py-16 text-foreground">
      <Container className="max-w-[680px]">
        <div className="border border-border bg-card p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <span
              className="size-2.5 shrink-0 rounded-full bg-warning"
              aria-hidden="true"
            />
            <p className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-warning uppercase">
              Scheduled maintenance
            </p>
          </div>

          <h1 className="mt-6 mb-0 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
            We&rsquo;ll be back shortly.
          </h1>
          <p className="mt-4 mb-0 max-w-[56ch] text-base leading-7 text-muted-foreground">
            {service} is temporarily unavailable while we make a few
            improvements. Thanks for your patience.
          </p>

          <div className="mt-8 border-t border-border pt-5">
            <p className="m-0 font-mono text-xs text-muted-foreground">
              Please try again in a little while.
            </p>
          </div>
        </div>
      </Container>
    </main>
  )
}
