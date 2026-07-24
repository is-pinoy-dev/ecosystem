import type { PortfolioData } from "@/lib/portfolio-data"

// DRAFT — blueprint, dark. Grid paper, title block, repos as a bill of
// materials. Styling in app/designer-themes.css (.dt-draft).
export function DraftDesign({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data
  return (
    <div className="dt-root dt-draft">
      <div className="pg">
        <div className="frame">
          <div className="dim">
            DWG. {profile.login}
            <br />
            SCALE <b>1:1</b>
            <br />
            SHEET <b>1 / 1</b>
          </div>
          <div className="tag">◺ Portfolio Specification</div>
          <h1>{profile.name ?? profile.login}</h1>
          <div className="role">{[profile.location].filter(Boolean).join(" — ")}</div>

          {profile.bio ? (
            <div className="dt-readme" style={{ marginBottom: 8 }}>
              <p>{profile.bio}</p>
            </div>
          ) : null}
          {readmeHtml ? (
            <div className="dt-readme" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
          ) : null}

          {repos.length > 0 ? (
            <>
              <div className="tag">Repositories — Bill of Materials</div>
              <div className="grid">
                {repos.map((r, i) => (
                  <div className="part" key={r.name}>
                    <div className="pno">PART No. {String(i + 1).padStart(3, "0")}</div>
                    <div className="pn">{r.name}</div>
                    {r.description ? <div className="pd">{r.description}</div> : null}
                    <div className="pm">
                      <span>MAT: {r.language ?? "—"}</span>
                      <span>★ {r.stars}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <div className="foot">
            REV. A ·{" "}
            {profile.links.map((l, i) => (
              <span key={l.href}>
                {i > 0 ? " / " : ""}
                <a href={l.href} target="_blank" rel="noopener noreferrer">
                  {l.label}
                </a>
              </span>
            ))}{" "}
            · {stats.followers} followers · is-pinoy.dev
          </div>
        </div>
      </div>
    </div>
  )
}
