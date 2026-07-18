import {
  SectionDescription,
  SectionEyebrow,
  SectionHeader,
  SectionTitle,
} from "@is-pinoy-dev/ui/components/section-header"

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
