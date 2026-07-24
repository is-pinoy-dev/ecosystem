import type { PortfolioData } from "@/lib/portfolio-data"

// PHOSPHOR — terminal, dark. Window chrome, CRT-green glow, ls -la listing.
// Styling in app/designer-themes.css (.dt-phosphor).
export function PhosphorDesign({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos, stats } = data
  return (
    <div className="dt-root dt-phosphor">
      <div className="scan" />
      <div className="pg">
        <div className="win">
          <div className="bar">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span style={{ marginLeft: 8 }}>{profile.login}@is-pinoy: ~</span>
          </div>
          <div className="body">
            <div>
              <span className="prompt">$</span> whoami
            </div>
            <h1>{profile.name ?? profile.login}</h1>
            <div className="dim">
              {"// "}
              {[profile.location, `${stats.followers} followers`].filter(Boolean).join(" — ")}
            </div>

            {profile.bio ? (
              <>
                <div style={{ marginTop: 16 }}>
                  <span className="prompt">$</span> cat bio.txt
                </div>
                <div>{profile.bio}</div>
              </>
            ) : null}

            {profile.links.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <span className="prompt">$</span> links <span className="dim">→</span>{" "}
                {profile.links.map((l, i) => (
                  <span key={l.href}>
                    {i > 0 ? " · " : ""}
                    <a href={l.href} target="_blank" rel="noopener noreferrer">
                      {l.label}
                    </a>
                  </span>
                ))}
              </div>
            ) : null}

            {readmeHtml ? (
              <>
                <div style={{ marginTop: 16 }}>
                  <span className="prompt">$</span> cat README.md
                </div>
                <div className="dt-readme" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
              </>
            ) : null}

            {repos.length > 0 ? (
              <>
                <div style={{ marginTop: 16 }}>
                  <span className="prompt">$</span> ls -la ~/repos
                </div>
                <div style={{ marginTop: 8 }}>
                  {repos.map((r) => (
                    <div className="lsrow" key={r.name}>
                      <span className="dim">-rwxr-xr-x</span>
                      <span className="amb">{r.stars}★</span>
                      <span>
                        <a href={r.url} target="_blank" rel="noopener noreferrer">
                          {r.name}
                        </a>{" "}
                        {r.description ? <span className="dim"># {r.description}</span> : null}
                      </span>
                      <span className="dim">{r.language ?? "-"}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}

            <div style={{ marginTop: 18 }}>
              <span className="prompt">$</span>
              <span className="cur" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
