import type { PortfolioData } from "@/lib/portfolio-data"

// CONCRETE — brutalist, light. Oversized Helvetica Black, numbered work index.
// Self-contained: styling lives in app/designer-themes.css under .dt-concrete.
export function ConcreteDesign({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data
  return (
    <div className="dt-root dt-concrete">
      <div className="pg">
        <div className="top">
          <span>{profile.login}.is-pinoy.dev</span>
          <span>
            {profile.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            ))}
          </span>
        </div>
        <h1>{profile.name ?? profile.login}</h1>
        <div className="role">@{profile.login}</div>
        {profile.bio ? <p className="bio">{profile.bio}</p> : null}
        <div className="meta">
          {profile.location ? <span>◉ {profile.location}</span> : null}
          <span>{stats.followers} followers</span>
          <span>{stats.publicRepos} repos</span>
        </div>

        {readmeHtml ? (
          <div className="dt-readme" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
        ) : null}

        {repos.length > 0 ? (
          <>
            <div className="sec">Selected Work</div>
            {repos.map((r, i) => (
              <div className="row" key={r.name}>
                <div className="num">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <div className="rn">{r.name}</div>
                  {r.description ? <div className="rd">{r.description}</div> : null}
                </div>
                <div className="rs">
                  ★ {r.stars}
                  {r.language ? <span className="rl">{r.language}</span> : null}
                </div>
              </div>
            ))}
          </>
        ) : null}

        <div className="foot">
          Built from{" "}
          <a href={`https://github.com/${profile.login}`} target="_blank" rel="noopener noreferrer">
            @{profile.login}
          </a>{" "}
          · is-pinoy.dev
        </div>
      </div>
    </div>
  )
}
