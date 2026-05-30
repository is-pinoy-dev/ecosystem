async function fetchSubdomains(): Promise<string[]> {
  try {
    const res = await fetch(
      "https://api.github.com/repos/is-pinoy-dev/domains/contents/subdomains",
      {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 3600 },
      }
    )
    if (!res.ok) return []
    const files = (await res.json()) as { name: string }[]
    return files
      .filter((f) => f.name.endsWith(".json"))
      .map((f) => f.name.replace(/\.json$/, ""))
  } catch {
    return []
  }
}

function MarqueeRow({
  items,
  reverse,
}: {
  items: string[]
  reverse?: boolean
}) {
  const doubled = [...items, ...items]

  return (
    <div className="flex overflow-hidden">
      <div
        className="flex shrink-0 gap-3"
        style={{
          animation: `${reverse ? "marquee-scroll-reverse" : "marquee-scroll"} ${items.length * 3}s linear infinite`,
        }}
      >
        {doubled.map((subdomain, i) => (
          <a
            key={i}
            href={`https://${subdomain}.is-pinoy.dev`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-2 border border-border bg-card/40 px-4 py-2 font-mono text-[12px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <span className="inline-block h-1.5 w-1.5 shrink-0 bg-green-500" />
            {subdomain}.is-pinoy.dev
          </a>
        ))}
      </div>
    </div>
  )
}

export async function SubdomainMarquee() {
  const subdomains = await fetchSubdomains()
  if (subdomains.length < 4) return null

  const mid = Math.ceil(subdomains.length / 2)
  const row1 = subdomains.slice(0, mid)
  const row2 = subdomains.slice(mid)

  return (
    <div className="w-full max-w-[680px] flex flex-col gap-3 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
      <MarqueeRow items={row1} />
      <MarqueeRow items={row2} reverse />
    </div>
  )
}
