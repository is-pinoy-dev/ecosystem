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
    <p className="font-pixel text-[9px] text-muted-foreground uppercase tracking-wider mb-1">
      {name}
    </p>
  )
}

function NoPreview() {
  return (
    <div className="border-2 border-dashed border-border px-3 py-4 text-center">
      <p className="font-pixel text-[9px] text-muted-foreground">NO OG IMAGE SET</p>
    </div>
  )
}

function FacebookCard({
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
        className="w-full aspect-[1.91/1] object-cover border-b-2 border-border"
      />
      <div className="px-3 py-2 space-y-0.5 bg-[#f0f2f5]">
        {site && (
          <p className="text-[10px] text-[#606770] uppercase tracking-wide">{site}</p>
        )}
        {title && (
          <p className="text-[12px] font-bold text-[#1c1e21] leading-snug line-clamp-2">{title}</p>
        )}
        {description && (
          <p className="text-[11px] text-[#606770] line-clamp-2">{description}</p>
        )}
      </div>
    </div>
  )
}

function TwitterLargeCard({
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
        className="w-full aspect-[1.91/1] object-cover border-b-2 border-[#2f3336]"
      />
      <div className="px-3 py-2 space-y-0.5">
        {title && (
          <p className="text-[12px] font-bold text-white leading-snug line-clamp-1">{title}</p>
        )}
        {description && (
          <p className="text-[11px] text-[#71767b] line-clamp-2">{description}</p>
        )}
        {site && (
          <p className="text-[10px] text-[#71767b]">{site}</p>
        )}
      </div>
    </div>
  )
}

function TwitterSummaryCard({
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
    <div className="border-2 border-[#2f3336] bg-black shadow-[3px_3px_0_var(--color-foreground)] flex gap-3 p-3">
      {image && (
        <img
          src={image}
          alt="twitter summary preview"
          className="w-16 h-16 object-cover shrink-0 border-2 border-[#2f3336]"
        />
      )}
      <div className="min-w-0 space-y-0.5">
        {title && (
          <p className="text-[12px] font-bold text-white leading-snug line-clamp-1">{title}</p>
        )}
        {description && (
          <p className="text-[11px] text-[#71767b] line-clamp-2">{description}</p>
        )}
        {site && (
          <p className="text-[10px] text-[#71767b]">{site}</p>
        )}
      </div>
    </div>
  )
}

function LinkedInCard({
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
        className="w-full aspect-[1.91/1] object-cover border-b-2 border-[#d0ccc8]"
      />
      <div className="px-3 py-2 space-y-0.5 bg-[#edf3f8]">
        {title && (
          <p className="text-[12px] font-bold text-[#000000e6] leading-snug line-clamp-2">{title}</p>
        )}
        {site && (
          <p className="text-[10px] text-[#00000099] uppercase tracking-wide">{site}</p>
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
      <div className="px-3 py-2 space-y-1">
        {site && (
          <p className="text-[10px] text-[#5865f2] font-semibold">{site}</p>
        )}
        {title && (
          <p className="text-[12px] font-bold text-[#5865f2] leading-snug line-clamp-2">{title}</p>
        )}
        {description && (
          <p className="text-[11px] text-[#dbdee1] line-clamp-3">{description}</p>
        )}
        {image && (
          <img
            src={image}
            alt="discord preview"
            className="w-full aspect-[1.91/1] object-cover mt-2 border-2 border-[#1e1f22]"
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
    <div className="space-y-3">
      <p className="font-pixel text-[11px] text-muted-foreground">// SOCIAL PREVIEWS</p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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
          <PlatformLabel name={`Twitter / X — ${isLargeCard ? "large card" : "summary"}`} />
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
