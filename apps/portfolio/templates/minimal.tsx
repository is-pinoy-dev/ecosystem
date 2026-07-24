import Image from "next/image"
import { Separator } from "@is-pinoy-dev/ui/components/separator"
import type { PortfolioData } from "@/lib/portfolio-data"

// A restrained, typographic layout: narrow centered column, generous
// whitespace, no cards or borders. Lets the README carry the page. Theme colors
// and the page frame come from the shell.
export function MinimalTemplate({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <header className="flex flex-col items-center gap-4 text-center">
        <Image
          src={profile.avatar}
          alt={profile.name ?? profile.login}
          width={80}
          height={80}
          className="border border-border"
          priority
        />
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-xl font-semibold text-foreground">
            {profile.name ?? profile.login}
          </h1>
          <p className="m-0 text-sm text-muted-foreground">@{profile.login}</p>
        </div>
        {profile.bio ? (
          <p className="m-0 max-w-prose text-sm leading-relaxed text-foreground">
            {profile.bio}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {profile.location ? <span>{profile.location}</span> : null}
          <span>{stats.followers} followers</span>
          <span>{stats.publicRepos} repos</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {profile.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent underline"
            >
              {link.label}
            </a>
          ))}
        </div>
      </header>

      {readmeHtml ? (
        <>
          <Separator className="my-10" />
          <section
            aria-label="Profile README"
            className="portfolio-readme text-sm leading-relaxed text-foreground"
            // Safe: sanitized in lib/parse.ts before it ever reaches here.
            dangerouslySetInnerHTML={{ __html: readmeHtml }}
          />
        </>
      ) : null}

      {repos.length > 0 ? (
        <>
          <Separator className="my-10" />
          <section aria-label="Top repositories">
            <h2 className="m-0 mb-4 text-xs tracking-[0.12em] text-muted-foreground uppercase">
              Selected work
            </h2>
            <ul className="m-0 flex list-none flex-col gap-4 p-0">
              {repos.map((repo) => (
                <li key={repo.name} className="flex flex-col gap-1">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground underline decoration-border underline-offset-4"
                  >
                    {repo.name}
                  </a>
                  {repo.description ? (
                    <p className="m-0 text-xs text-muted-foreground">
                      {repo.description}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {repo.language ? <span>{repo.language}</span> : null}
                    <span>★ {repo.stars}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </main>
  )
}
