/** biome-ignore-all lint/suspicious/noCommentText: <explanation> */
interface OgPreviewsProps {
  ogImage: string | null
  ogTitle: string | null
  ogDescription: string | null
  ogSiteName: string | null
  ogUrl: string | null
  twitterCard: string | null
  twitterImage: string | null
  twitterTitle: string | null
  twitterDescription: string | null
  twitterSite: string | null
}

function hostname(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function PlatformLabel({ name }: { name: string }) {
  return (
    <p className="mb-1 font-pixel text-[9px] tracking-wider text-muted-foreground uppercase">
      {name}
    </p>
  )
}

function NoPreview() {
  return (
    <div className="border-2 border-dashed border-border px-3 py-4 text-center">
      <p className="font-pixel text-[9px] text-muted-foreground">
        NO OG IMAGE SET
      </p>
    </div>
  )
}

export function FacebookCard({
  image,
  title,
  description,
  siteName,
  url,
}: {
  image: string | null
  title: string | null
  description: string | null
  siteName: string | null
  url: string | null
}) {
  if (!image) return <NoPreview />
  const site = siteName ?? hostname(url)
  return (
    <div className="border-2 border-border bg-[#f0f2f5] shadow-[3px_3px_0_var(--color-foreground)]">
      <img
        src={image}
        alt="og preview"
        className="aspect-[1.91/1] w-full border-b-2 border-border object-cover"
      />
      <div className="space-y-0.5 bg-[#f0f2f5] px-3 py-2">
        {site && (
          <p className="text-[10px] tracking-wide text-[#606770] uppercase">
            {site}
          </p>
        )}
        {title && (
          <p className="line-clamp-2 text-[12px] leading-snug font-bold text-[#1c1e21]">
            {title}
          </p>
        )}
        {description && (
          <p className="line-clamp-2 text-[11px] text-[#606770]">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}

export function TwitterLargeCard({
  image,
  title,
  description,
  site,
}: {
  image: string | null
  title: string | null
  description: string | null
  site: string | null
}) {
  if (!image) return <NoPreview />
  return (
    <div className="border-2 border-[#2f3336] bg-black shadow-[3px_3px_0_var(--color-foreground)]">
      <img
        src={image}
        alt="twitter preview"
        className="aspect-[1.91/1] w-full border-b-2 border-[#2f3336] object-cover"
      />
      <div className="space-y-0.5 px-3 py-2">
        {title && (
          <p className="line-clamp-1 text-[12px] leading-snug font-bold text-white">
            {title}
          </p>
        )}
        {description && (
          <p className="line-clamp-2 text-[11px] text-[#71767b]">
            {description}
          </p>
        )}
        {site && <p className="text-[10px] text-[#71767b]">{site}</p>}
      </div>
    </div>
  )
}

export function TwitterSummaryCard({
  image,
  title,
  description,
  site,
}: {
  image: string | null
  title: string | null
  description: string | null
  site: string | null
}) {
  return (
    <div className="flex gap-3 border-2 border-[#2f3336] bg-black p-3 shadow-[3px_3px_0_var(--color-foreground)]">
      {image && (
        <img
          src={image}
          alt="twitter summary preview"
          className="h-16 w-16 shrink-0 border-2 border-[#2f3336] object-cover"
        />
      )}
      <div className="min-w-0 space-y-0.5">
        {title && (
          <p className="line-clamp-1 text-[12px] leading-snug font-bold text-white">
            {title}
          </p>
        )}
        {description && (
          <p className="line-clamp-2 text-[11px] text-[#71767b]">
            {description}
          </p>
        )}
        {site && <p className="text-[10px] text-[#71767b]">{site}</p>}
      </div>
    </div>
  )
}

export function LinkedInCard({
  image,
  title,
  siteName,
  url,
}: {
  image: string | null
  title: string | null
  siteName: string | null
  url: string | null
}) {
  if (!image) return <NoPreview />
  const site = siteName ?? hostname(url)
  return (
    <div className="border-2 border-[#d0ccc8] bg-white shadow-[3px_3px_0_var(--color-foreground)]">
      <img
        src={image}
        alt="linkedin preview"
        className="aspect-[1.91/1] w-full border-b-2 border-[#d0ccc8] object-cover"
      />
      <div className="space-y-0.5 bg-[#edf3f8] px-3 py-2">
        {title && (
          <p className="line-clamp-2 text-[12px] leading-snug font-bold text-[#000000e6]">
            {title}
          </p>
        )}
        {site && (
          <p className="text-[10px] tracking-wide text-[#00000099] uppercase">
            {site}
          </p>
        )}
      </div>
    </div>
  )
}

function DiscordCard({
  image,
  title,
  description,
  siteName,
  url,
}: {
  image: string | null
  title: string | null
  description: string | null
  siteName: string | null
  url: string | null
}) {
  const site = siteName ?? hostname(url)
  return (
    <div
      className="border-2 border-[#1e1f22] bg-[#2b2d31] shadow-[3px_3px_0_var(--color-foreground)]"
      style={{ borderLeft: "4px solid #5865f2" }}
    >
      <div className="space-y-1 px-3 py-2">
        {site && (
          <p className="text-[10px] font-semibold text-[#5865f2]">{site}</p>
        )}
        {title && (
          <p className="line-clamp-2 text-[12px] leading-snug font-bold text-[#5865f2]">
            {title}
          </p>
        )}
        {description && (
          <p className="line-clamp-3 text-[11px] text-[#dbdee1]">
            {description}
          </p>
        )}
        {image && (
          <img
            src={image}
            alt="discord preview"
            className="mt-2 aspect-[1.91/1] w-full border-2 border-[#1e1f22] object-cover"
          />
        )}
      </div>
    </div>
  )
}

export function OgPreviews({
  ogImage,
  ogTitle,
  ogDescription,
  ogSiteName,
  ogUrl,
  twitterCard,
  twitterImage,
  twitterTitle,
  twitterDescription,
  twitterSite,
}: OgPreviewsProps) {
  const twImage = twitterImage ?? ogImage
  const twTitle = twitterTitle ?? ogTitle
  const twDescription = twitterDescription ?? ogDescription
  const isLargeCard = !twitterCard || twitterCard === "summary_large_image"

  return (
    <div className="mt-20 space-y-4">
      <p className="font-pixel text-[11px] text-primary">// SOCIAL PREVIEWS</p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <PlatformLabel name="Facebook" />
          <FacebookCard
            image={ogImage}
            title={ogTitle}
            description={ogDescription}
            siteName={ogSiteName}
            url={ogUrl}
          />
        </div>

        <div>
          <PlatformLabel
            name={`Twitter / X — ${isLargeCard ? "large card" : "summary"}`}
          />
          {isLargeCard ? (
            <TwitterLargeCard
              image={twImage}
              title={twTitle}
              description={twDescription}
              site={twitterSite}
            />
          ) : (
            <TwitterSummaryCard
              image={twImage}
              title={twTitle}
              description={twDescription}
              site={twitterSite}
            />
          )}
        </div>

        <div>
          <PlatformLabel name="LinkedIn" />
          <LinkedInCard
            image={ogImage}
            title={ogTitle}
            siteName={ogSiteName}
            url={ogUrl}
          />
        </div>

        <div>
          <PlatformLabel name="Discord" />
          <DiscordCard
            image={ogImage}
            title={ogTitle}
            description={ogDescription}
            siteName={ogSiteName}
            url={ogUrl}
          />
        </div>
      </div>
    </div>
  )
}
