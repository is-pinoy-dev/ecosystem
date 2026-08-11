import Image from "next/image"
import { MapPin, Star, Users } from "lucide-react"
import { Badge } from "@is-pinoy-dev/ui/components/badge"
import { Card, CardContent, CardHeader } from "@is-pinoy-dev/ui/components/card"
import { compactCount } from "@/lib/format"
import type { PortfolioData } from "@/lib/portfolio-data"

// Full pixel-art treatment: bordered cards with hard offset shadows (no blur),
// a bold hero card, and a repo grid. Theme colors and the page frame come from
// the shell.
export function PixelCardTemplate({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Card className="border-2 border-border shadow-[6px_6px_0_var(--primary)]">
        <CardHeader className="flex flex-col items-start gap-5 sm:flex-row sm:items-start">
          <Image
            src={profile.avatar}
            alt={profile.name ?? profile.login}
            width={96}
            height={96}
            className="shrink-0 border-2 border-border"
            priority
          />
          <div className="flex min-w-0 flex-col gap-2">
            {/* The owner's name is the page's one H1 — the heading a crawler
                reads the page's subject from. CardTitle renders a <div>, so
                this is the native fallback, the same one MinimalTemplate and
                TerminalTemplate use. */}
            <h1 className="m-0 font-mono text-lg font-medium wrap-anywhere text-primary">
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
                    className="border-2 border-border px-2 py-1 font-mono text-xs text-accent transition-colors duration-150 hover:border-accent hover:text-primary"
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      {/* The README is the owner's own introduction, so it follows the hero
          here just as it does in the other layout templates — the repo grid is
          the supporting evidence, not the opening statement. */}
      {readmeHtml ? (
        <Card className="mt-8 border-2 border-border">
          <CardContent>
            <section
              aria-label="Profile README"
              className="portfolio-readme text-sm leading-relaxed text-foreground"
              // Safe: sanitized in lib/parse.ts before it ever reaches here.
              dangerouslySetInnerHTML={{ __html: readmeHtml }}
            />
          </CardContent>
        </Card>
      ) : null}

      {repos.length > 0 ? (
        <section aria-label="Top repositories" className="mt-8">
          <h2 className="m-0 mb-4 font-mono text-xs tracking-[0.12em] text-accent uppercase">
            Top repositories
          </h2>
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((repo) => (
              <li key={repo.name}>
                <Card className="h-full border-2 border-border shadow-[4px_4px_0_var(--border)] transition-shadow duration-150 hover:shadow-[4px_4px_0_var(--primary)]">
                  <CardContent className="flex h-full flex-col gap-2">
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm wrap-anywhere text-primary"
                    >
                      {repo.name}
                    </a>
                    {repo.description ? (
                      <p className="m-0 text-xs leading-relaxed text-muted-foreground">
                        {repo.description}
                      </p>
                    ) : null}
                    <div className="mt-auto flex items-center gap-3 pt-2 font-mono text-xs text-muted-foreground">
                      {repo.language ? <Badge>{repo.language}</Badge> : null}
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5" aria-hidden="true" />
                        {compactCount(repo.stars)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
