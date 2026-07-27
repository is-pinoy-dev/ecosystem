import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const alt = "is-pinoy.dev dashboard — manage your free subdomains."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const background = "#0B0D12"
const foreground = "#F2F1EC"
const muted = "#8A8F9A"
const accent = "#6EA8FF"
const border = "#1F232D"

export default async function OgImage() {
  const [logoData, geistSemiBold] = await Promise.all([
    readFile(join(process.cwd(), "public", "logo.png"), "base64"),
    readFile(join(process.cwd(), "assets", "fonts", "Geist-SemiBold.ttf")),
  ])

  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: 72,
        backgroundColor: background,
        fontFamily: "Geist Sans",
      }}
    >
      {/* Accent rule along the top edge, mirroring the dashboard header border. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 8,
          backgroundColor: accent,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {/* ImageResponse renders this directly; next/image is not supported here. */}
        <img
          src={`data:image/png;base64,${logoData}`}
          alt=""
          width={72}
          height={72}
          style={{ width: 72, height: 72, objectFit: "contain" }}
        />
        <div
          style={{
            display: "flex",
            color: muted,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Dashboard
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div
          style={{
            display: "flex",
            color: foreground,
            fontSize: 68,
            fontWeight: 600,
            letterSpacing: "-0.035em",
            lineHeight: 1.1,
          }}
        >
          Manage your free .is-pinoy.dev subdomains
        </div>
        <div
          style={{
            display: "flex",
            color: muted,
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            lineHeight: 1.4,
          }}
        >
          Domains, DNS records, and pending changes — all in one place.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          paddingTop: 32,
          borderTop: `2px solid ${border}`,
          color: accent,
          fontSize: 26,
          fontWeight: 600,
          letterSpacing: "-0.01em",
        }}
      >
        dashboard.is-pinoy.dev
      </div>
    </div>,
    {
      ...size,
      fonts: [
        {
          name: "Geist Sans",
          data: geistSemiBold,
          style: "normal",
          weight: 600,
        },
      ],
    }
  )
}
