"use client"

import { useState } from "react"
import Image from "next/image"
import { RESERVED_SUBDOMAINS } from "@is-pinoy-dev/validate"

type CheckStatus = "idle" | "loading" | "taken" | "available" | "error"

interface SubdomainRecord {
  subdomain: string
  owner: { github: string; email: string }
  records: { CNAME?: { value: string } }
}

function ResultCard({
  status,
  subdomain,
  record,
}: {
  status: "taken" | "available" | "error"
  subdomain: string
  record: SubdomainRecord | null
}) {
  if (status === "error") {
    return (
      <div className="mt-4 flex w-full max-w-[560px] items-center gap-3 border-[3px] border-[#444444] bg-[#0D0D0D] px-5 py-4 shadow-[5px_5px_0_#000]">
        <span className="font-[family-name:var(--font-mono)] text-[13px] leading-none text-[#888888]">
          Unable to check — try again.
        </span>
      </div>
    )
  }

  if (status === "taken" && !record) {
    return (
      <div className="mt-4 flex w-fit items-center gap-3 border-[3px] border-[#444444] bg-[#0D0D0D] px-5 py-4 shadow-[5px_5px_0_#000]">
        <span className="font-[family-name:var(--font-mono)] text-[13px] leading-none text-[#888888]">
          <span className="text-[#F5C800]">{subdomain}</span>.is-pinoy.dev is reserved.
        </span>
      </div>
    )
  }

  if (status === "taken" && record) {
    return (
      <div className="mt-4 flex w-fit items-center gap-4 border-[3px] border-[#F5C800] bg-[#0D0D0D] px-5 py-4 shadow-[5px_5px_0_#000]">
        <Image
          src={`https://github.com/${record.owner.github}.png?size=48`}
          alt={record.owner.github}
          width={48}
          height={48}
          className="shrink-0 border-[2px] border-[#F5C800] [image-rendering:pixelated]"
          unoptimized
        />
        <div className="flex flex-col items-start gap-[6px]">
          <span className="font-[family-name:var(--font-mono)] text-[14px] leading-none text-[#FAFAF5]">
            @{record.owner.github}
          </span>
          <span className="font-[family-name:var(--font-sans)] text-[13px] text-[#888888]">
            <span className="font-[family-name:var(--font-mono)] text-[#F5C800]">
              {subdomain}
            </span>
            .is-pinoy.dev is already claimed.
          </span>
        </div>
      </div>
    )
  }

  // available
  return (
    <div className="mt-4 flex w-full max-w-[560px] flex-wrap items-center justify-between gap-4 border-[3px] border-[#F5C800] px-6 py-5 shadow-[5px_5px_0_#D4A800]">
      <span className="font-[family-name:var(--font-pixel)] text-[9px] leading-[1.6]">
        ✓ <span className="text-primary">{subdomain}</span>.is-pinoy.dev is
        available!
      </span>
      <a
        href="https://docs.is-pinoy.dev"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block cursor-pointer bg-[#F5C800] px-5 py-3 font-[family-name:var(--font-pixel)] text-[9px] tracking-[0.05em] whitespace-nowrap text-[#0D0D0D] no-underline shadow-[3px_3px_0_#D4A800] transition-all duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#FFE566] hover:shadow-[1px_1px_0_#D4A800]"
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

    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      setRecord(null)
      setStatus("taken")
      return
    }

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

  console.log({ value, status, record, checkedSubdomain })

  return (
    <div className="flex w-full max-w-[560px] flex-col items-center">
      {/* Input row */}
      <div className="flex w-full items-stretch border-[3px] border-[#F5C800] shadow-[6px_6px_0_#FAFAF5,0_0_24px_rgba(245,200,0,0.12)]">
        {/* Input zone */}
        <div className="relative flex min-w-0 flex-1 items-center bg-[#0D0D0D]">
          <input
            type="text"
            aria-label="Subdomain"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="relative z-[1] w-full border-none bg-transparent py-[18px] pr-2 pl-4 font-[family-name:var(--font-mono)] text-[13px] leading-none text-[#FAFAF5] caret-[#F5C800] outline-none"
          />
          {value === "" && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute top-0 bottom-0 left-4 z-0 flex items-center gap-px font-[family-name:var(--font-mono)] text-[13px] leading-none text-[#444444]"
            >
              <span>yourname</span>
              <span className="blink text-[#F5C800]">█</span>
            </div>
          )}
        </div>

        {/* Suffix */}
        <div className="flex shrink-0 items-center bg-[#0D0D0D] py-[18px] pr-3 pl-0 font-[family-name:var(--font-mono)] text-[13px] leading-none whitespace-nowrap text-[#3A3A3A] select-none max-[639px]:pr-1 sm:pr-[12px]">
          .is-pinoy.dev
        </div>

        {/* Divider */}
        <div className="w-[3px] shrink-0 bg-[#F5C800]" />

        {/* Check button */}
        <button
          type="button"
          aria-label={
            status === "loading"
              ? "Checking availability"
              : "Check availability"
          }
          onClick={handleCheck}
          disabled={status === "loading"}
          className={`shrink-0 border-none px-6 py-[18px] font-[family-name:var(--font-pixel)] text-[9px] tracking-[0.05em] whitespace-nowrap text-[#0D0D0D] transition-colors duration-100 hover:enabled:bg-[#FFE566] max-[639px]:px-[14px] ${status === "loading" ? "cursor-not-allowed" : "cursor-pointer"}`}
          style={{
            backgroundColor: status === "loading" ? "#D4A800" : "#F5C800",
          }}
        >
          {status === "loading" ? "..." : "CHECK"}
        </button>
      </div>

      {/* Result card */}
      {(status === "taken" || status === "available" || status === "error") && (
        <ResultCard
          status={status}
          subdomain={checkedSubdomain}
          record={record}
        />
      )}
    </div>
  )
}
