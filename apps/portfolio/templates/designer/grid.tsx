import { compactCount } from "@/lib/format"
import type { PortfolioData } from "@/lib/portfolio-data"

// GRID — Swiss, light. Red rule, tabular repository index, strict grid.
// Styling in app/designer-themes.css (.dt-grid).
export function GridDesign({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data
  return (
    <div className="dt-root dt-grid">
      <div className="pg">
        <div className="head">
          <div className="idxn">Portfolio / {profile.login}.is-pinoy.dev</div>
          <div className="idxn idxn-right">{profile.location ?? ""}</div>
          <h1>{profile.name ?? profile.login}</h1>
          <div className="rt">
            {profile.bio ? (
              <>
                <span className="lbl">About</span>
                {profile.bio}
                <br />
                <br />
              </>
            ) : null}
            <span className="lbl">Index</span>
            {compactCount(stats.followers)} followers · {compactCount(stats.publicRepos)} repos
            <br />
            <br />
            <span className="lbl">Links</span>
            {profile.links.map((l, i) => (
              <span key={l.href}>
                {i > 0 ? "  " : ""}
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </span>
            ))}
          </div>
          {readmeHtml ? (
            <div className="dt-readme" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
          ) : null}
        </div>

        {repos.length > 0 ? (
          <div className="sec">
            <h2 className="sec-title">Repository index</h2>
            <div className="r colhead">
              <span>№</span>
              <span>Repository</span>
              <span>Description</span>
              <span>Lang</span>
              <span className="s">Stars</span>
            </div>
            {repos.map((r, i) => (
              <div className="r" key={r.name}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>
                <span className="t">{r.name}</span>
                <span className="d">{r.description ?? ""}</span>
                <span className="l">{r.language ?? ""}</span>
                <span className="s">{compactCount(r.stars)} ★</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="foot">
          Built from @{profile.login} ·{" "}
          <a href={`https://github.com/${profile.login}`} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>{" "}
          · is-pinoy.dev
        </div>
      </div>
    </div>
  )
}
