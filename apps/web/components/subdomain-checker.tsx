"use client"

import { useState } from "react"
import Image from "next/image"

type CheckStatus = "idle" | "loading" | "taken" | "available" | "error"

interface SubdomainRecord {
  subdomain: string
  owner: { github: string; email: string }
  records: { CNAME?: { value: string } }
}

function ResultCard({ status, subdomain, record }: {
  status: "taken" | "available" | "error"
  subdomain: string
  record: SubdomainRecord | null
}) {
  if (status === "error") {
    return (
      <div className="mt-4 px-5 py-4 border-[3px] border-[#444444] shadow-[5px_5px_0_#000] bg-[#0D0D0D] max-w-[560px] w-full flex items-center gap-3">
        <span className="font-[family-name:var(--font-mono)] text-[13px] leading-none text-[#888888]">
          Unable to check — try again.
        </span>
      </div>
    )
  }

  if (status === "taken" && record) {
    return (
      <div className="mt-4 px-5 py-4 border-[3px] border-[#F5C800] shadow-[5px_5px_0_#000] bg-[#0D0D0D] max-w-[560px] w-full flex items-center gap-4">
        <Image
          src={`https://github.com/${record.owner.github}.png?size=48`}
          alt={record.owner.github}
          width={48}
          height={48}
          className="[image-rendering:pixelated] border-[2px] border-[#F5C800] shrink-0"
          unoptimized
        />
        <div className="flex flex-col gap-[6px]">
          <span className="font-[family-name:var(--font-mono)] text-[14px] leading-none text-[#FAFAF5]">
            @{record.owner.github}
          </span>
          <span className="font-[family-name:var(--font-sans)] text-[13px] text-[#888888]">
            {subdomain}.is-pinoy.dev is already claimed.
          </span>
        </div>
      </div>
    )
  }

  // available
  return (
    <div className="mt-4 px-6 py-5 border-[3px] border-[#F5C800] shadow-[5px_5px_0_#D4A800] bg-[rgba(245,200,0,0.06)] max-w-[560px] w-full flex items-center justify-between gap-4 flex-wrap">
      <span className="font-[family-name:var(--font-pixel)] text-[9px] text-[#F5C800] leading-[1.6]">
        ✓ {subdomain}.is-pinoy.dev is available!
      </span>
      <a
        href="https://docs.is-pinoy.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="font-[family-name:var(--font-pixel)] text-[9px] text-[#0D0D0D] bg-[#F5C800] px-5 py-3 cursor-pointer tracking-[0.05em] no-underline inline-block shadow-[3px_3px_0_#D4A800] whitespace-nowrap transition-all duration-100 hover:bg-[#FFE566] hover:shadow-[1px_1px_0_#D4A800] hover:translate-x-[2px] hover:translate-y-[2px]"
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
    <div className="flex flex-col items-center w-full max-w-[560px]">
      {/* Input row */}
      <div className="flex items-stretch border-[3px] border-[#F5C800] shadow-[6px_6px_0_#FAFAF5,0_0_24px_rgba(245,200,0,0.12)] w-full">
        {/* Input zone */}
        <div className="relative flex-1 min-w-0 flex items-center bg-[#0D0D0D]">
          <input
            type="text"
            aria-label="Subdomain"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="font-[family-name:var(--font-mono)] text-[13px] leading-none text-[#FAFAF5] bg-transparent border-none py-[18px] pr-2 pl-4 w-full outline-none caret-[#F5C800] relative z-[1]"
          />
          {value === "" && (
            <div
              aria-hidden="true"
              className="font-[family-name:var(--font-mono)] text-[13px] leading-none absolute left-4 top-0 bottom-0 flex items-center pointer-events-none text-[#444444] z-0 gap-px"
            >
              <span>yourname</span>
              <span className="blink text-[#F5C800]">█</span>
            </div>
          )}
        </div>

        {/* Suffix */}
        <div className="font-[family-name:var(--font-mono)] text-[13px] leading-none text-[#3A3A3A] bg-[#0D0D0D] py-[18px] pr-3 sm:pr-[12px] pl-0 flex items-center whitespace-nowrap select-none shrink-0 max-[639px]:pr-1">
          .is-pinoy.dev
        </div>

        {/* Divider */}
        <div className="w-[3px] bg-[#F5C800] shrink-0" />

        {/* Check button */}
        <button
          aria-label={status === "loading" ? "Checking availability" : "Check availability"}
          onClick={handleCheck}
          disabled={status === "loading"}
          className={`font-[family-name:var(--font-pixel)] text-[9px] text-[#0D0D0D] border-none py-[18px] px-6 max-[639px]:px-[14px] tracking-[0.05em] transition-colors duration-100 whitespace-nowrap shrink-0 hover:enabled:bg-[#FFE566] ${status === "loading" ? "cursor-not-allowed" : "cursor-pointer"}`}
          style={{ backgroundColor: status === "loading" ? "#D4A800" : "#F5C800" }}
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
