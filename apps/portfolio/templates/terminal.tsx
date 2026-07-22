import Image from "next/image"
import { MapPin, Star, Users } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import type { PortfolioData } from "@/lib/portfolio-data"
import type { PortfolioTheme } from "./index"

// The one template built for the spike: a terminal-style single column that
// leans into the retro pixel-art system (Press Start 2P headings, hard borders,
// gold-on-dark). README content is injected as pre-sanitized HTML.
export function TerminalTemplate({
  data,
  theme = "gold-dark",
}: {
  data: PortfolioData
  theme?: PortfolioTheme
}) {
  const { profile, readmeHtml, repos, stats } = data

  return (
    <main
      data-theme={theme}
      className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6"
    >
      <header className="flex flex-col items-start gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:gap-6">
        <Image
          src={profile.avatar}
          alt={profile.name ?? profile.login}
          width={88}
          height={88}
          className="border border-border"
          priority
        />
        <div className="flex flex-col gap-2">
          <h1 className="m-0 font-mono text-base text-primary sm:text-lg">
            {profile.name ?? profile.login}
          </h1>
          <p className="m-0 font-mono text-xs text-muted-foreground">
            @{profile.login}
          </p>
          {profile.bio ? (
            <p className="m-0 max-w-prose text-sm text-foreground">
              {profile.bio}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {profile.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {profile.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" />
              {stats.followers} followers
            </span>
            <span>{stats.publicRepos} repos</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            {profile.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-accent underline"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {readmeHtml ? (
        <section
          aria-label="Profile README"
          className="portfolio-readme mt-8 text-sm leading-relaxed text-foreground"
          // Safe: sanitized in lib/parse.ts before it ever reaches here.
          dangerouslySetInnerHTML={{ __html: readmeHtml }}
        />
      ) : null}

      {repos.length > 0 ? (
        <section aria-label="Top repositories" className="mt-10">
          <h2 className="m-0 mb-4 font-mono text-xs tracking-[0.12em] text-accent uppercase">
            Top repositories
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
            {repos.map((repo) => (
              <li key={repo.name} className="border border-border p-4">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm text-primary"
                >
                  {repo.name}
                </a>
                {repo.description ? (
                  <p className="m-0 mt-2 text-xs text-muted-foreground">
                    {repo.description}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  {repo.language ? <Badge>{repo.language}</Badge> : null}
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5" aria-hidden="true" />
                    {repo.stars}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
