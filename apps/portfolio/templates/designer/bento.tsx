import Image from "next/image"
import { compactCount } from "@/lib/format"
import type { PortfolioData } from "@/lib/portfolio-data"

// BENTO — modern, light. A soft-sage modular canvas with a portrait card,
// compact profile stats, and repository tiles.
export function BentoDesign({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data

  return (
    <div className="dt-root dt-bento">
      <div className="pg">
        <header className="bento-nav">
          <a
            className="bento-brand"
            href={`https://github.com/${profile.login}`}
          >
            <span className="bento-brand-mark" aria-hidden="true">
              {profile.login.slice(0, 1).toUpperCase()}
            </span>
            <span>{profile.login}.dev</span>
          </a>
          <nav aria-label="Profile links">
            {profile.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label} <span aria-hidden="true">↗</span>
              </a>
            ))}
          </nav>
        </header>

        <main className="bento-layout">
          <section className="bento-intro">
            <p className="bento-kicker">
              Developer profile
              <span aria-hidden="true" />
              {profile.location ?? "GitHub"}
            </p>
            <h1>{profile.name ?? profile.login}</h1>
            {profile.bio ? <p className="bento-bio">{profile.bio}</p> : null}
            <dl className="bento-stats">
              <div>
                <dt>Followers</dt>
                <dd>{compactCount(stats.followers)}</dd>
              </div>
              <div>
                <dt>Public repos</dt>
                <dd>{compactCount(stats.publicRepos)}</dd>
              </div>
              <div>
                <dt>Selected here</dt>
                <dd>{repos.length}</dd>
              </div>
            </dl>
          </section>

          <aside
            className="bento-portrait"
            aria-label={`${profile.login} profile photo`}
          >
            <Image
              src={profile.avatar}
              alt=""
              width={460}
              height={460}
              sizes="(max-width: 760px) 100vw, 34vw"
              priority
            />
            <div className="bento-portrait-label">
              <span>GitHub</span>
              <strong>@{profile.login}</strong>
            </div>
          </aside>

          {readmeHtml ? (
            <section className="bento-about">
              <p className="bento-section-label">README / About</p>
              <div
                className="dt-readme"
                dangerouslySetInnerHTML={{ __html: readmeHtml }}
              />
            </section>
          ) : null}

          {repos.length > 0 ? (
            <section className="bento-work">
              <div className="bento-section-head">
                <p className="bento-section-label">Selected repositories</p>
                <span>{String(repos.length).padStart(2, "0")} projects</span>
              </div>
              <div className="bento-repos">
                {repos.map((repo, index) => (
                  <a
                    className="bento-repo"
                    href={repo.url}
                    key={repo.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="bento-repo-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <strong>{repo.name}</strong>
                    {repo.description ? <span>{repo.description}</span> : null}
                    <small>
                      {repo.language ?? "Repository"}
                      <span>★ {compactCount(repo.stars)}</span>
                    </small>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <footer className="bento-foot">
          <span>Built from a live GitHub profile</span>
          <span>Hosted by is-pinoy.dev</span>
        </footer>
      </div>
    </div>
  )
}
