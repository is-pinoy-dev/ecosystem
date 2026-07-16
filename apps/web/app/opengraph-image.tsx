import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "is-pinoy.dev — Free subdomains for Filipino developers."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const navy = "#0B2D57"
const gold = "#F9B900"
const paper = "#F7F3EE"
const muted = "#AAA493"

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: paper,
        color: navy,
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 16px 16px, rgba(11,45,87,0.035) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: -70,
          right: -20,
          width: 360,
          height: 430,
          transform: "rotate(45deg)",
          borderLeft: `3px solid ${navy}`,
          borderRight: `3px solid ${navy}`,
          opacity: 0.95,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 55,
          right: 20,
          width: 300,
          height: 360,
          transform: "rotate(45deg)",
          borderLeft: `2px solid ${muted}`,
          borderRight: `2px solid ${muted}`,
          opacity: 0.85,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 130,
          right: -45,
          width: 220,
          height: 330,
          transform: "rotate(45deg)",
          borderLeft: `3px solid ${navy}`,
          borderRight: `3px solid ${navy}`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "58px 66px 0",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              position: "relative",
              width: 80,
              height: 80,
              display: "flex",
            }}
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  left: 36,
                  top: 2,
                  width: 8,
                  height: 76,
                  backgroundColor: gold,
                  borderRadius: 8,
                  transformOrigin: "4px 38px",
                  transform: `rotate(${index * 45}deg)`,
                }}
              />
            ))}
            <div
              style={{
                position: "absolute",
                left: 32,
                top: 32,
                width: 16,
                height: 16,
                backgroundColor: paper,
                borderRadius: 999,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: "-0.04em",
            }}
          >
            is-pinoy.dev
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: 30,
            marginTop: 72,
          }}
        >
          <div
            style={{
              width: 6,
              height: 132,
              backgroundColor: gold,
              borderRadius: 999,
            }}
          />
          <div
            style={{
              display: "flex",
              maxWidth: 700,
              fontSize: 62,
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: "-0.055em",
            }}
          >
            Free subdomains for Filipino developers.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            marginTop: 62,
          }}
        >
          <div style={{ width: 54, height: 3, backgroundColor: "#1265B3" }} />
          <div
            style={{
              display: "flex",
              fontSize: 21,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#1265B3",
              textTransform: "uppercase",
            }}
          >
            Community-run
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 116,
          display: "flex",
          backgroundColor: gold,
          borderTop: `2px solid ${navy}`,
        }}
      >
        <div style={{ flex: 1 }} />
        <div style={{ width: 2, backgroundColor: navy, opacity: 0.9 }} />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 27,
            letterSpacing: "0.14em",
            fontFamily: "monospace",
            color: navy,
          }}
        >
          SUBDOMAINS CLAIMED
        </div>
      </div>
    </div>,
    { ...size }
  )
}
