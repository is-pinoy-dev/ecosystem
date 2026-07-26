import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"
import { Skeleton } from "@is-pinoy-dev/ui/components/skeleton"

interface PageHeaderProps {
  eyebrow: string
  title: string
  description?: string
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <SectionHeader className="gap-2">
      <SectionEyebrow>{eyebrow}</SectionEyebrow>
      <SectionTitle className="text-2xl tracking-[-0.02em] sm:text-3xl">
        {title}
      </SectionTitle>
      {description && (
        <SectionDescription className="text-sm leading-6">
          {description}
        </SectionDescription>
      )}
    </SectionHeader>
  )
}

/**
 * Loading placeholder mirroring `PageHeader` — same eyebrow / title /
 * description rhythm so the header does not jump when content resolves.
 * `descriptionLines` should match how many lines the real copy wraps to.
 */
export function PageHeaderSkeleton({
  titleWidth = "w-64",
  descriptionLines = 1,
}: {
  titleWidth?: string
  descriptionLines?: number
}) {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className={`h-8 max-w-full sm:h-9 ${titleWidth}`} />
      <div className="flex max-w-[640px] flex-col gap-2 pt-1">
        {Array.from({ length: descriptionLines }, (_, index) => (
          <Skeleton
            key={index}
            className={
              index === descriptionLines - 1 && descriptionLines > 1
                ? "h-3.5 w-2/3"
                : "h-3.5 w-full"
            }
          />
        ))}
      </div>
    </div>
  )
}
