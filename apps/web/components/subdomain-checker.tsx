"use client"

import { useState } from "react"
import Image from "next/image"

type CheckStatus = "idle" | "loading" | "taken" | "available" | "error"

interface SubdomainRecord {
  subdomain: string
  owner: { github: string; email: string }
  records: { CNAME?: { value: string } }
}

const monoStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "13px",
  lineHeight: 1,
}

const pixelStyle: React.CSSProperties = {
  fontFamily: "var(--font-pixel)",
}

const sansStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
}

function ResultCard({ status, subdomain, record }: {
  status: "taken" | "available" | "error"
  subdomain: string
  record: SubdomainRecord | null
}) {
  if (status === "error") {
    return (
      <div style={{
        marginTop: "16px",
        padding: "16px 20px",
        border: "3px solid #444444",
        boxShadow: "5px 5px 0 #000",
        backgroundColor: "#0D0D0D",
        maxWidth: "560px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <span style={{ ...monoStyle, color: "#888888" }}>
          Unable to check — try again.
        </span>
      </div>
    )
  }

  if (status === "taken" && record) {
    return (
      <div style={{
        marginTop: "16px",
        padding: "16px 20px",
        border: "3px solid #F5C800",
        boxShadow: "5px 5px 0 #000",
        backgroundColor: "#0D0D0D",
        maxWidth: "560px",
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <Image
          src={`https://github.com/${record.owner.github}.png?size=48`}
          alt={record.owner.github}
          width={48}
          height={48}
          style={{ imageRendering: "pixelated", border: "2px solid #F5C800", flexShrink: 0 }}
          unoptimized
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ ...monoStyle, color: "#FAFAF5", fontSize: "14px" }}>
            @{record.owner.github}
          </span>
          <span style={{ ...sansStyle, fontSize: "13px", color: "#888888" }}>
            {subdomain}.is-pinoy.dev is already claimed.
          </span>
        </div>
      </div>
    )
  }

  // available
  return (
    <div style={{
      marginTop: "16px",
      padding: "20px 24px",
      border: "3px solid #F5C800",
      boxShadow: "5px 5px 0 #D4A800",
      backgroundColor: "rgba(245,200,0,0.06)",
      maxWidth: "560px",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      flexWrap: "wrap",
    }}>
      <span style={{
        ...pixelStyle,
        fontSize: "9px",
        color: "#F5C800",
        lineHeight: 1.6,
      }}>
        ✓ {subdomain}.is-pinoy.dev is available!
      </span>
      <a
        href="https://docs.is-pinoy.dev"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          ...pixelStyle,
          fontSize: "9px",
          color: "#0D0D0D",
          backgroundColor: "#F5C800",
          border: "none",
          padding: "12px 20px",
          cursor: "pointer",
          letterSpacing: "0.05em",
          textDecoration: "none",
          display: "inline-block",
          transition: "background-color 0.1s ease, box-shadow 0.1s ease, transform 0.1s ease",
          boxShadow: "3px 3px 0 #D4A800",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#FFE566"
          e.currentTarget.style.boxShadow = "1px 1px 0 #D4A800"
          e.currentTarget.style.transform = "translate(2px, 2px)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#F5C800"
          e.currentTarget.style.boxShadow = "3px 3px 0 #D4A800"
          e.currentTarget.style.transform = "translate(0, 0)"
        }}
      >
        CLAIM IT →
      </a>
    </div>
  )
}

export function SubdomainChecker() {
  const [value, setValue] = useState("")
  const [status, setStatus] = useState<CheckStatus>("idle")
  const [record, setRecord] = useState<SubdomainRecord | null>(null)
  const [checkedSubdomain, setCheckedSubdomain] = useState("")

  const handleCheck = async () => {
    const subdomain = value.trim().toLowerCase()
    if (!subdomain) return

    setStatus("loading")
    setCheckedSubdomain(subdomain)

    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/${subdomain}.json`,
        { cache: "no-store" }
      )

      if (res.ok) {
        const data: SubdomainRecord = await res.json()
        setRecord(data)
        setStatus("taken")
      } else if (res.status === 404) {
        setRecord(null)
        setStatus("available")
      } else {
        setStatus("error")
      }
    } catch {
      setStatus("error")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleCheck()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    if (status !== "idle") setStatus("idle")
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "560px" }}>
      {/* Input row */}
      <div style={{
        display: "flex",
        alignItems: "stretch",
        border: "3px solid #F5C800",
        boxShadow: "6px 6px 0 #FAFAF5, 0 0 24px rgba(245,200,0,0.12)",
        width: "100%",
      }}>
        {/* Input zone */}
        <div style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          backgroundColor: "#0D0D0D",
        }}>
          <input
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            style={{
              ...monoStyle,
              color: "#FAFAF5",
              backgroundColor: "transparent",
              border: "none",
              padding: "18px 8px 18px 16px",
              width: "100%",
              outline: "none",
              caretColor: "#F5C800",
              position: "relative",
              zIndex: 1,
            }}
          />
          {value === "" && (
            <div
              aria-hidden="true"
              style={{
                ...monoStyle,
                position: "absolute",
                left: "16px",
                top: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
                color: "#444444",
                zIndex: 0,
                gap: "1px",
              }}
            >
              <span>yourname</span>
              <span className="blink" style={{ color: "#F5C800" }}>█</span>
            </div>
          )}
        </div>

        {/* Suffix */}
        <div className="subdomain-suffix" style={{
          ...monoStyle,
          color: "#3A3A3A",
          backgroundColor: "#0D0D0D",
          padding: "18px 12px 18px 0",
          display: "flex",
          alignItems: "center",
          whiteSpace: "nowrap",
          userSelect: "none",
          flexShrink: 0,
        }}>
          .is-pinoy.dev
        </div>

        {/* Divider */}
        <div style={{ width: "3px", backgroundColor: "#F5C800", flexShrink: 0 }} />

        {/* Check button */}
        <button
          onClick={handleCheck}
          disabled={status === "loading"}
          className="subdomain-claim-btn"
          style={{
            ...pixelStyle,
            fontSize: "9px",
            color: "#0D0D0D",
            backgroundColor: status === "loading" ? "#D4A800" : "#F5C800",
            border: "none",
            padding: "18px 24px",
            cursor: status === "loading" ? "not-allowed" : "pointer",
            letterSpacing: "0.05em",
            transition: "background-color 0.1s ease",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (status !== "loading") e.currentTarget.style.backgroundColor = "#FFE566"
          }}
          onMouseLeave={(e) => {
            if (status !== "loading") e.currentTarget.style.backgroundColor = "#F5C800"
          }}
        >
          {status === "loading" ? "..." : "CHECK"}
        </button>
      </div>

      {/* Result card */}
      {(status === "taken" || status === "available" || status === "error") && (
        <ResultCard status={status} subdomain={checkedSubdomain} record={record} />
      )}
    </div>
  )
}
