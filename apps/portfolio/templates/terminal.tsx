import Image from "next/image"
import { MapPin, Star, Users } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { compactCount } from "@/lib/format"
import type { PortfolioData } from "@/lib/portfolio-data"

// A terminal-style single column that leans into the retro pixel-art system
// (mono headings, hard borders). README content is injected as pre-sanitized
// HTML. Theme colors and the page frame come from the shell.
export function TerminalTemplate({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <header className="flex flex-col items-start gap-5 border-b border-border pb-8 sm:flex-row sm:items-start sm:gap-6">
        <Image
          src={profile.avatar}
          alt={profile.name ?? profile.login}
          width={88}
          height={88}
          className="shrink-0 border border-border"
          priority
        />
        <div className="flex min-w-0 flex-col gap-2">
          <h1 className="m-0 font-mono text-base wrap-anywhere text-primary sm:text-lg">
            {profile.name ?? profile.login}
          </h1>
          <p className="m-0 font-mono text-xs text-muted-foreground">
            @{profile.login}
          </p>
          {profile.bio ? (
            <p className="m-0 max-w-prose text-sm leading-relaxed text-foreground">
              {profile.bio}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
            {profile.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" aria-hidden="true" />
                {profile.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden="true" />
              {compactCount(stats.followers)} followers
            </span>
            <span>{compactCount(stats.publicRepos)} repos</span>
          </div>
          {profile.links.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-border px-2 py-1 font-mono text-xs text-accent transition-colors duration-150 hover:border-accent hover:text-primary"
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
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
        <section
          aria-label="Top repositories"
          className="mt-10 border-t border-border pt-8"
        >
          <h2 className="m-0 mb-4 font-mono text-xs tracking-[0.12em] text-accent uppercase">
            Top repositories
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
            {repos.map((repo) => (
              <li
                key={repo.name}
                className="flex flex-col border border-border p-4 transition-colors duration-150 hover:border-accent"
              >
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm wrap-anywhere text-primary"
                >
                  {repo.name}
                </a>
                {repo.description ? (
                  <p className="m-0 mt-2 text-xs leading-relaxed text-muted-foreground">
                    {repo.description}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center gap-3 pt-3 font-mono text-xs text-muted-foreground">
                  {repo.language ? <Badge>{repo.language}</Badge> : null}
                  <span className="inline-flex items-center gap-1">
                    <Star className="size-3.5" aria-hidden="true" />
                    {compactCount(repo.stars)}
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
