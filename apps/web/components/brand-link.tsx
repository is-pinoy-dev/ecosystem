import Image from "next/image"
import { ProgressLink } from "@/components/progress-link"

/**
 * The header's brand mark. Shared so the header's loading state can render the
 * real logo rather than a grey block — none of it depends on feature flags, so
 * there is nothing here worth waiting for.
 *
 * `banner.gif` is the brand's motion and is served unoptimized and `priority` so
 * it animates as authored and is not the thing holding up first paint.
 */
export function BrandLink() {
  return (
    <ProgressLink
      href="/"
      className="flex max-w-[220px] min-w-0 shrink-0 items-center gap-2.5 no-underline"
      aria-label="is-pinoy.dev home"
    >
      <Image
        src="/logo.png"
        alt=""
        width={32}
        height={32}
        className="size-8 shrink-0 object-contain object-left [image-rendering:pixelated]"
      />
      <Image
        src="/banner.gif"
        alt="is-pinoy.dev"
        width={200}
        height={26}
        unoptimized
        priority
        className="h-6 w-auto max-w-[150px] object-contain object-left"
      />
    </ProgressLink>
  )
}
