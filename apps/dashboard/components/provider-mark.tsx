import {
  STROKE_PROVIDERS,
  type Provider,
  type ProviderId,
} from "@/lib/providers"

/**
 * A host's brand mark. Rendered inline rather than as an `<img>` so it inherits
 * the surrounding text colour when the brand mark is monochrome, and so the page
 * stays free of external image requests.
 */
export function ProviderMark({
  provider,
  className = "size-4",
}: {
  provider: Provider
  className?: string
}) {
  const stroke = STROKE_PROVIDERS.includes(provider.id as ProviderId)

  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={provider.name}
      className={className}
      fill={stroke ? "none" : (provider.brand ?? "currentColor")}
      stroke={stroke ? (provider.brand ?? "currentColor") : undefined}
      strokeWidth={stroke ? 2 : undefined}
      strokeLinecap={stroke ? "round" : undefined}
    >
      <path d={provider.path} />
    </svg>
  )
}
