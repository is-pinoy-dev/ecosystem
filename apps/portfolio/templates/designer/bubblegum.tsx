import { compactCount } from "@/lib/format"
import type { PortfolioData } from "@/lib/portfolio-data"

// BUBBLEGUM — Y2K pop, colorful. Gradient wash, sticker cards on a tilt.
// Styling in app/designer-themes.css (.dt-bubblegum).
export function BubblegumDesign({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data
  // Each fact is its own element, spaced by the row's gap. Written inline it
  // relied on JSX whitespace, which drops the space between an expression and
  // the text after it across a line break — the follower count used to run
  // straight into its own label.
  const meta = [
    profile.location ? `◍ ${profile.location}` : null,
    `✦ ${compactCount(stats.followers)} followers`,
    `✧ ${compactCount(stats.publicRepos)} repos`,
  ].filter(Boolean)
  return (
    <div className="dt-root dt-bubblegum">
      <div className="pg">
        <div className="top">
          <span className="brand">{profile.login}.is-pinoy.dev</span>
          <span>
            {profile.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                ✷ {l.label}
              </a>
            ))}
          </span>
        </div>

        <div className="hero">
          <h1>{profile.name ?? profile.login}</h1>
          <span className="role">@{profile.login} ✷</span>
          {profile.bio ? <p className="bio">{profile.bio}</p> : null}
          <div className="meta">
            {meta.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>

        {readmeHtml ? (
          <div className="dt-readme" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
        ) : null}

        {repos.length > 0 ? (
          <>
            <h2 className="sec">Projects ✷</h2>
            <div className="grid">
              {repos.map((r) => (
                <div className="c" key={r.name}>
                  <div className="cn">{r.name}</div>
                  {r.description ? <div className="cd">{r.description}</div> : null}
                  <div className="cm">
                    {r.language ? <span className="pill">{r.language}</span> : null}
                    <span>★ {compactCount(r.stars)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <div className="foot">
          made by{" "}
          <a href={`https://github.com/${profile.login}`} target="_blank" rel="noopener noreferrer">
            @{profile.login}
          </a>{" "}
          ✿ hosted on is-pinoy.dev
        </div>
      </div>
    </div>
  )
}
