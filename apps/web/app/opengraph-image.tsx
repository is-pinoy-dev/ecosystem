import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "is-pinoy.dev — Free Subdomains for Filipino Developers"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0D0D0D",
          backgroundImage: "linear-gradient(rgba(245,200,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,0,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          gap: 32,
          padding: "60px 80px",
        }}
      >
        {/* Top marquee strip */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: "#F5C800",
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            fontSize: 16,
            color: "#F5C800",
            border: "2px solid #F5C800",
            padding: "8px 20px",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          {"// FREE FOR FILIPINO DEVS"}
        </div>

        {/* Site name */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", fontSize: 28, color: "#FAFAF5", letterSpacing: "0.05em" }}>
            Claim your
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 72,
              color: "#0D0D0D",
              backgroundColor: "#F5C800",
              padding: "12px 48px",
              letterSpacing: "0.05em",
            }}
          >
            PINOY PRIDE
          </div>
          <div style={{ display: "flex", fontSize: 28, color: "#FAFAF5", letterSpacing: "0.05em" }}>
            on the Web.
          </div>
        </div>

        {/* Domain badge */}
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#888888",
            letterSpacing: "0.05em",
          }}
        >
          yourname.is-pinoy.dev
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", fontSize: 14, color: "#F5C800", letterSpacing: "0.1em" }}>
            IS-PINOY.DEV
          </div>
          <div style={{ display: "flex", width: 4, height: 4, backgroundColor: "#F5C800" }} />
          <div style={{ display: "flex", fontSize: 14, color: "#555555", letterSpacing: "0.05em" }}>
            Open source · Community-driven · Forever free
          </div>
        </div>

        {/* Bottom border */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: "#F5C800",
          }}
        />
      </div>
    ),
    { ...size },
  )
}
