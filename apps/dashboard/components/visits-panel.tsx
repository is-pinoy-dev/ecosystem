import type { SubdomainVisits } from "@/lib/analytics"

/**
 * Visit totals for one subdomain.
 *
 * A single series, so there is no legend and no categorical palette — the
 * heading names the measure and the marks take one ink colour. Bars are drawn
 * in the text colour rather than the brand yellow: #F5C800 sits at roughly
 * 1.7:1 on the card surface, which is fine for a filled button with dark text
 * on it and unreadable as a thin data mark.
 *
 * Every number the chart encodes is also readable as text — the window total,
 * the peak, and the per-country table — so nothing depends on hovering a bar.
 *
 * Dates render as raw ISO. The listing formats its other dates on the server
 * precisely so the client emits no locale-dependent text, and `YYYY-MM-DD` is
 * both locale-independent and the format the rest of the record metadata uses.
 */

/** How many countries to name before the rest become "Other". */
const TOP_COUNTRIES = 5

interface Props {
  /** Null when the analytics database is not configured for this deployment. */
  visits: SubdomainVisits | null
  /** Newest day collected platform-wide; null when nothing has been collected. */
  through: string | null
  windowDays: number
  /** Saved state of the record's proxy switch. */
  proxied: boolean
  /** Saved state of the Visit analytics switch. */
  enabled: boolean
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section className="border-t border-border px-4 py-3">
      <h4 className="m-0 font-mono text-[11px] tracking-[0.12em] text-muted-foreground uppercase">
        Visits
      </h4>
      {children}
    </section>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 mb-0 text-[13px] text-muted-foreground">{children}</p>
  )
}

export function VisitsPanel({
  visits,
  through,
  windowDays,
  proxied,
  enabled,
}: Props) {
  // Unproxied traffic never reaches Cloudflare, so there is nothing to count
  // regardless of the switch below. Naming that is more useful than showing an
  // empty chart or blaming a setting the owner did not change.
  if (!proxied) {
    return (
      <Frame>
        <Note>
          This record is DNS-only, so its traffic goes straight to your origin
          and is never measured. Switch on the platform above to see visits.
        </Note>
      </Frame>
    )
  }

  // Switched off is a state to state plainly, not an empty chart — there is no
  // data because none was collected, and saying so is the point of the switch.
  if (!enabled) {
    return (
      <Frame>
        <Note>
          Collection is off for this subdomain. Cloudflare still measures
          proxied traffic at its edge, but nothing is stored for it here and
          nothing is backfilled if you switch it back on.
        </Note>
      </Frame>
    )
  }

  // Not configured for this deployment: the feature is absent rather than
  // broken, so it renders nothing at all.
  if (!visits) return null

  if (through === null) {
    return (
      <Frame>
        <Note>
          No visit data has been collected yet. Totals appear the day after
          collection starts.
        </Note>
      </Frame>
    )
  }

  const peak = visits.series.reduce(
    (best, point) => (point.visits > best.visits ? point : best),
    visits.series[0] ?? { date: through, visits: 0 }
  )
  const first = visits.series[0]?.date ?? through

  const named = visits.countries.slice(0, TOP_COUNTRIES)
  const rest = visits.countries.slice(TOP_COUNTRIES)
  const otherTotal = rest.reduce((sum, entry) => sum + entry.visits, 0)
  const rows =
    otherTotal > 0
      ? [...named, { country: "Other", visits: otherTotal }]
      : named
  const countryMax = rows[0]?.visits ?? 0

  return (
    <Frame>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {/* Sans, not mono: proportional figures read better at this size, and
            nothing is aligned under it that would want equal-width digits. */}
        <span className="text-2xl leading-none font-semibold text-foreground">
          {visits.total.toLocaleString("en-US")}
        </span>
        <span className="text-[13px] text-muted-foreground">
          visits in the last {windowDays} days
        </span>
      </div>

      {/* Bars are a fixed narrow width rather than stretched to fill: across a
          full-width panel thirty stretched bars become heavy blocks, which is
          the opposite of what a summary strip should read as. Sizing to
          content also lets the caption below stand on its own line instead of
          having to align with the chart's ends. */}
      <div className="mt-3 overflow-x-auto">
        <div
          className="flex h-12 w-fit items-end gap-[2px]"
          role="img"
          aria-label={`Daily visits from ${first} to ${through}. ${visits.total.toLocaleString("en-US")} total${visits.total > 0 ? `, peaking at ${peak.visits.toLocaleString("en-US")} on ${peak.date}` : ""}.`}
        >
          {visits.series.map((point) => {
            const ratio = peak.visits > 0 ? point.visits / peak.visits : 0
            return (
              <span
                key={point.date}
                className="flex h-full w-2 items-end"
                title={`${point.date} · ${point.visits.toLocaleString("en-US")} visits`}
              >
                {point.visits > 0 ? (
                  <span
                    className="w-full bg-foreground transition-[height] duration-150"
                    // Runtime value: a percentage derived from the data. Floored
                    // so a real but tiny day is still a visible mark.
                    style={{ height: `${Math.max(ratio * 100, 4)}%` }}
                  />
                ) : (
                  // A collected day with no traffic. Drawn as a baseline tick so
                  // it reads as zero rather than as a gap in collection.
                  <span className="h-px w-full bg-border" />
                )}
              </span>
            )
          })}
        </div>
      </div>

      <p className="mt-1.5 mb-0 font-mono text-[11px] text-muted-foreground">
        {first} → {through}
        {/* No peak on an empty window: "Peak 0" is noise dressed as a finding. */}
        {visits.total > 0
          ? ` · peak ${peak.visits.toLocaleString("en-US")} on ${peak.date}`
          : null}
      </p>

      {visits.total === 0 ? (
        <Note>
          No visits recorded in this window. Data is collected through{" "}
          <span className="font-mono">{through}</span>.
        </Note>
      ) : (
        <table className="mt-3 w-full border-collapse text-[13px]">
          <caption className="sr-only">
            Visits by country over the last {windowDays} days
          </caption>
          <tbody>
            {rows.map((entry) => (
              <tr key={entry.country} className="border-t border-border/70">
                <th
                  scope="row"
                  className="w-16 py-1.5 text-left font-mono text-xs font-normal text-foreground"
                >
                  {entry.country}
                </th>
                <td className="py-1.5 pr-3 pl-1">
                  <span
                    className="flex h-1.5 w-full bg-muted"
                    aria-hidden="true"
                  >
                    <span
                      className="bg-foreground/70"
                      style={{
                        width: `${countryMax > 0 ? (entry.visits / countryMax) * 100 : 0}%`,
                      }}
                    />
                  </span>
                </td>
                <td className="w-16 py-1.5 text-right font-mono text-xs text-muted-foreground tabular-nums">
                  {entry.visits.toLocaleString("en-US")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Frame>
  )
}
