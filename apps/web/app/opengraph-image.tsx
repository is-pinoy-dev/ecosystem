import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { ImageResponse } from "next/og"
import { getRegisteredSubdomains } from "@/lib/subdomains"

export const runtime = "nodejs"
export const alt = "is-pinoy.dev — The home of Filipino developers."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const accent = "#175CD3"

function formatCount(count: number | null): string {
  if (count === null) return "—"

  const roundedCount = count < 10 ? count : Math.floor(count / 10) * 10
  return `${roundedCount.toLocaleString("en")}+`
}

export default async function OgImage() {
  const [backgroundData, geistSemiBold, subdomainCount] = await Promise.all([
    readFile(
      join(process.cwd(), "public", "og-landing-background.jpg"),
      "base64"
    ),
    readFile(join(process.cwd(), "assets", "fonts", "Geist-SemiBold.ttf")),
    getRegisteredSubdomains()
      .then((subdomains) => subdomains.length || null)
      .catch(() => null),
  ])

  const countLabel = formatCount(subdomainCount)

  return new ImageResponse(
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: "#F4F6F8",
      }}
    >
      {/* ImageResponse renders this background directly; next/image is not supported here. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`data:image/jpeg;base64,${backgroundData}`}
        alt=""
        width={size.width}
        height={size.height}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 190,
          left: 47,
          display: "flex",
          color: accent,
          fontFamily: "Geist Sans",
          fontSize: 64,
          fontWeight: 600,
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        {countLabel}
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
