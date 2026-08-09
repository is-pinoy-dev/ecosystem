import Image from "next/image"
import type { PortfolioData } from "@/lib/portfolio-data"

// NOIR — cinematic, dark. High-contrast display type, monochrome portrait,
// restrained gold details, and a film-credit-inspired project index.
export function NoirDesign({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data
  const displayName = profile.name ?? profile.login

  return (
    <div className="dt-root dt-noir">
      <div className="pg">
        <header className="noir-nav">
          <span className="noir-edition">Portfolio / MMXXVI</span>
          <nav aria-label="Profile links">
            {profile.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </header>

        <main>
          <section className="noir-hero">
            <div className="noir-title">
              <p>Independent developer · @{profile.login}</p>
              <h1>{displayName}</h1>
              <div className="noir-rule">
                <span />
                <strong>{profile.location ?? "Online"}</strong>
              </div>
              {profile.bio ? <p className="noir-bio">{profile.bio}</p> : null}
            </div>

            <figure className="noir-portrait">
              <Image
                src={profile.avatar}
                alt=""
                width={520}
                height={640}
                sizes="(max-width: 760px) 100vw, 36vw"
                priority
              />
              <figcaption>
                <span>Profile study</span>
                <span>No. 01</span>
              </figcaption>
            </figure>

            <dl className="noir-stats">
              <div>
                <dt>Followers</dt>
                <dd>{String(stats.followers).padStart(2, "0")}</dd>
              </div>
              <div>
                <dt>Repositories</dt>
                <dd>{String(stats.publicRepos).padStart(2, "0")}</dd>
              </div>
            </dl>
          </section>

          {readmeHtml ? (
            <section className="noir-about">
              <div className="noir-section-title">
                <span>01</span>
                <h2>About the work</h2>
              </div>
              <div
                className="dt-readme"
                dangerouslySetInnerHTML={{ __html: readmeHtml }}
              />
            </section>
          ) : null}

          {repos.length > 0 ? (
            <section className="noir-work">
              <div className="noir-section-title">
                <span>{readmeHtml ? "02" : "01"}</span>
                <h2>Selected projects</h2>
              </div>
              <div className="noir-projects">
                {repos.map((repo, index) => (
                  <a
                    className="noir-project"
                    href={repo.url}
                    key={repo.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <strong>{repo.name}</strong>
                    <span>{repo.description ?? "Open-source repository"}</span>
                    <small>{repo.language ?? "—"}</small>
                    <small>★ {repo.stars}</small>
                    <b aria-hidden="true">↗</b>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <footer className="noir-foot">
          <span>
            © {new Date().getFullYear()} {displayName}
          </span>
          <a
            href={`https://github.com/${profile.login}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/{profile.login}
          </a>
          <span>is-pinoy.dev</span>
        </footer>
      </div>
    </div>
  )
}
