import type { PortfolioData } from "@/lib/portfolio-data"

// BROADSHEET — editorial, warm paper. Italic serif masthead, drop-cap README,
// dotted-leader work index. Styling in app/designer-themes.css (.dt-broadsheet).
export function BroadsheetDesign({ data }: { data: PortfolioData }) {
  const { profile, readmeHtml, repos } = data
  const roleLine = [profile.location].filter(Boolean).join(" · ")
  return (
    <div className="dt-root dt-broadsheet">
      <div className="pg">
        <div className="masthead">
          <div className="kicker">The Portfolio · Est. MMXXVI · is-pinoy.dev</div>
          <div className="drule" />
          <h1>{profile.name ?? profile.login}</h1>
          {roleLine ? <div className="role">{roleLine}</div> : null}
          <div className="byline">
            {profile.links.map((l) => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            ))}
          </div>
        </div>

        {profile.bio ? (
          <p style={{ fontStyle: "italic", fontSize: 20, margin: "30px 0 0", textAlign: "center" }}>
            {profile.bio}
          </p>
        ) : null}

        {readmeHtml ? (
          <div className="dt-readme" dangerouslySetInnerHTML={{ __html: readmeHtml }} />
        ) : null}

        {repos.length > 0 ? (
          <>
            <div className="sec">Selected Works</div>
            {repos.map((r) => (
              <div className="item" key={r.name}>
                <span className="it-t">
                  {r.name}
                  {r.description ? <span className="it-d"> — {r.description}</span> : null}
                </span>
                <span className="dots" />
                <span className="it-s">{r.stars} ★</span>
              </div>
            ))}
          </>
        ) : null}

        <div className="foot">
          Built from{" "}
          <a href={`https://github.com/${profile.login}`} target="_blank" rel="noopener noreferrer">
            @{profile.login}
          </a>
          &rsquo;s GitHub profile
        </div>
      </div>
    </div>
  )
}
