import Image from "next/image"
import { compactCount } from "@/lib/format"
import type { PortfolioData } from "@/lib/portfolio-data"

// SOLAR — colorful. A vivid poster system with citrus orange, ultramarine,
// oversized orbit shapes, and playful project panels.
export function SolarDesign({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data

  return (
    <div className="dt-root dt-solar">
      <div className="solar-orbit solar-orbit-one" aria-hidden="true" />
      <div className="solar-orbit solar-orbit-two" aria-hidden="true" />
      <div className="pg">
        <header className="solar-nav">
          <a
            href={`https://github.com/${profile.login}`}
            className="solar-brand"
          >
            {profile.login}
            <span>●</span>dev
          </a>
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
          <section className="solar-hero">
            <div className="solar-copy">
              <p className="solar-kicker">
                Developer portfolio <span>✦</span>{" "}
                {profile.location ?? "GitHub"}
              </p>
              <h1>{profile.name ?? profile.login}</h1>
              {profile.bio ? <p className="solar-bio">{profile.bio}</p> : null}
              <div className="solar-meta">
                <span>{compactCount(stats.followers)} followers</span>
                <span>{compactCount(stats.publicRepos)} public repos</span>
              </div>
            </div>
            <div className="solar-photo-wrap">
              <div className="solar-sun" aria-hidden="true" />
              <div className="solar-photo">
                <Image
                  src={profile.avatar}
                  alt=""
                  width={500}
                  height={500}
                  sizes="(max-width: 760px) 90vw, 36vw"
                  priority
                />
              </div>
              <span className="solar-photo-tag">@{profile.login}</span>
            </div>
          </section>

          <div className="solar-ticker" aria-hidden="true">
            <span>Design</span>
            <b>✦</b>
            <span>Code</span>
            <b>✦</b>
            <span>Community</span>
            <b>✦</b>
            <span>Open source</span>
          </div>

          {readmeHtml ? (
            <section className="solar-about">
              <div className="solar-section-title">
                <span>01 / Profile README</span>
                <h2>A little more about me</h2>
              </div>
              <div
                className="dt-readme"
                dangerouslySetInnerHTML={{ __html: readmeHtml }}
              />
            </section>
          ) : null}

          {repos.length > 0 ? (
            <section className="solar-work">
              <div className="solar-section-title">
                <span>{readmeHtml ? "02" : "01"} / Selected work</span>
                <h2>Things I&apos;ve been building</h2>
              </div>
              <div className="solar-projects">
                {repos.map((repo, index) => (
                  <a
                    className="solar-project"
                    href={repo.url}
                    key={repo.name}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="solar-project-no">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <strong>{repo.name}</strong>
                    <p>{repo.description ?? "Open-source repository"}</p>
                    <small>
                      {repo.language ?? "Repository"}
                      <span>★ {compactCount(repo.stars)}</span>
                    </small>
                    <b aria-hidden="true">↗</b>
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </main>

        <footer className="solar-foot">
          <strong>Let&apos;s make something bright.</strong>
          <span>Live from GitHub · Hosted on is-pinoy.dev</span>
        </footer>
      </div>
    </div>
  )
}
