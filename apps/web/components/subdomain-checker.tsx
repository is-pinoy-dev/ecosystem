"use client"

import { useState } from "react"
import Image from "next/image"
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  XCircle,
} from "lucide-react"
import { RESERVED_SUBDOMAINS } from "@is-pinoy-dev/validate"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Input } from "@is-pinoy-dev/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
} from "@is-pinoy-dev/ui/components/input-group"

type CheckStatus =
  | "idle"
  | "loading"
  | "available"
  | "claimed"
  | "reserved"
  | "validation-error"
  | "network-error"

interface SubdomainRecord {
  subdomain: string
  owner: { github: string; email: string }
  records: { CNAME?: { value: string } }
}

function ResultPanel({
  status,
  subdomain,
  record,
}: {
  status: "available" | "claimed" | "reserved" | "validation-error" | "network-error"
  subdomain: string
  record: SubdomainRecord | null
}) {
  if (status === "validation-error") {
    return (
      <div className="flex items-start gap-3 border border-destructive/35 bg-destructive/5 p-4 text-sm text-foreground">
        <AlertTriangle
          className="mt-0.5 size-[18px] shrink-0 text-destructive"
          aria-hidden="true"
        />
        <span>
          Use only letters, numbers, and hyphens. No spaces or symbols.
        </span>
      </div>
    )
  }

  if (status === "network-error") {
    return (
      <div className="flex items-start gap-3 border border-destructive/35 bg-destructive/5 p-4 text-sm text-foreground">
        <RefreshCw
          className="mt-0.5 size-[18px] shrink-0 text-destructive"
          aria-hidden="true"
        />
        <span>
          We couldn&apos;t complete this check. Please try again.
        </span>
      </div>
    )
  }

  if (status === "reserved") {
    return (
      <div className="flex items-start gap-3 border border-border bg-background p-4 text-sm text-foreground">
        <XCircle
          className="mt-0.5 size-[18px] shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span>
          <span className="font-mono font-medium">
            {subdomain}.is-pinoy.dev
          </span>{" "}
          is reserved and not available to claim.
        </span>
      </div>
    )
  }

  if (status === "claimed") {
    return (
      <div className="flex items-center gap-3 border border-border bg-card p-4">
        {record ? (
          <Image
            src={`https://github.com/${record.owner.github}.png?size=80`}
            alt=""
            width={40}
            height={40}
            className="size-10 shrink-0 border border-border object-cover"
            unoptimized
          />
        ) : null}
        <div className="min-w-0">
          {record ? (
            <p className="m-0 truncate text-sm font-semibold text-foreground">
              @{record.owner.github}
            </p>
          ) : null}
          <p className="m-0 mt-1 text-[13px] text-muted-foreground">
            <span className="font-mono">{subdomain}.is-pinoy.dev</span> is
            already claimed.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-4 border border-success/35 bg-success/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 text-sm text-foreground">
        <CheckCircle2
          className="mt-0.5 size-[18px] shrink-0 text-success"
          aria-hidden="true"
        />
        <span>
          <span className="font-mono font-semibold">
            {subdomain}.is-pinoy.dev
          </span>{" "}
          is available.
        </span>
      </div>
      <Button asChild size="sm" className="w-full shrink-0 sm:w-auto">
        <a
          href="https://docs.is-pinoy.dev/guides"
          target="_blank"
          rel="noopener noreferrer"
        >
          Start registration
          <ArrowUpRight aria-hidden="true" />
        </a>
      </Button>
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
    if (!subdomain || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(subdomain)) {
      setCheckedSubdomain(subdomain)
      setStatus("validation-error")
      return
    }

    setStatus("loading")
    setCheckedSubdomain(subdomain)

    if (RESERVED_SUBDOMAINS.includes(subdomain)) {
      setRecord(null)
      setStatus("reserved")
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains/${subdomain}.json`,
        { cache: "no-store", signal: controller.signal }
      )

      if (res.ok) {
        setRecord((await res.json()) as SubdomainRecord)
        setStatus("claimed")
      } else if (res.status === 404) {
        setRecord(null)
        setStatus("available")
      } else {
        setStatus("network-error")
      }
    } catch {
      setStatus("network-error")
    } finally {
      clearTimeout(timeout)
    }
  }

  const isResult =
    status === "available" ||
    status === "claimed" ||
    status === "reserved" ||
    status === "validation-error" ||
    status === "network-error"

  return (
    <div className="w-full max-w-[430px] lg:max-w-[460px]">
      <p
        id="checker-title"
        className="m-0 mb-[18px] font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase"
      >
        Check availability
      </p>
      <form
        aria-labelledby="checker-title"
        onSubmit={(event) => {
          event.preventDefault()
          void handleCheck()
        }}
      >
        <InputGroup className="h-14 bg-card">
          <Input
            type="text"
            aria-label="Subdomain name"
            aria-invalid={status === "validation-error"}
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              if (status !== "idle") setStatus("idle")
            }}
            placeholder="yourname"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-auto min-w-0 flex-1 border-0 bg-transparent px-[18px] font-mono text-base text-foreground shadow-none outline-none focus-visible:border-transparent focus-visible:outline-none"
          />
          <InputGroupAddon className="whitespace-nowrap px-[18px] font-mono text-sm text-foreground sm:text-[15px]">
            .is-pinoy.dev
          </InputGroupAddon>
        </InputGroup>
        <p className="m-0 mt-2.5 text-xs leading-[1.5] text-muted-foreground">
          Use letters, numbers, and hyphens. No spaces.
        </p>
        <Button
          type="submit"
          className="mt-[18px] h-[52px] w-full gap-2 px-[18px] text-sm disabled:opacity-70"
          disabled={status === "loading"}
        >
          {status === "loading" ? "Checking…" : "Check availability"}
          {status !== "loading" && (
            <ArrowUpRight className="size-[17px]" aria-hidden="true" />
          )}
        </Button>
      </form>

      <div className="mt-4" aria-live="polite">
        {isResult && (
          <ResultPanel
            status={status}
            subdomain={checkedSubdomain}
            record={record}
          />
        )}
      </div>
    </div>
  )
}
