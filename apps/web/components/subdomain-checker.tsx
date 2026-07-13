"use client"

import { useState } from "react"
import Image from "next/image"
import { AlertCircle, ArrowUpRight, CheckCircle2, XCircle } from "lucide-react"
import { RESERVED_SUBDOMAINS } from "@is-pinoy-dev/validate"
import { Button } from "@is-pinoy-dev/ui/components/button"
import { Input } from "@is-pinoy-dev/ui/components/input"
import {
  InputGroup,
  InputGroupAddon,
} from "@is-pinoy-dev/ui/components/input-group"

type CheckStatus = "idle" | "loading" | "taken" | "available" | "error"

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
  status: "taken" | "available" | "error"
  subdomain: string
  record: SubdomainRecord | null
}) {
  if (status === "error") {
    return (
      <div className="flex items-start gap-3 border border-destructive/35 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>
          Unable to check this name. Use letters, numbers, or hyphens and try
          again.
        </span>
      </div>
    )
  }

  if (status === "taken" && !record) {
    return (
      <div className="flex items-start gap-3 border border-border bg-muted p-4 text-sm text-foreground">
        <XCircle
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span>
          <span className="font-mono font-medium">
            {subdomain}.is-pinoy.dev
          </span>{" "}
          is reserved.
        </span>
      </div>
    )
  }

  if (status === "taken" && record) {
    return (
      <div className="flex items-center gap-3 border border-border bg-card p-4">
        <Image
          src={`https://github.com/${record.owner.github}.png?size=48`}
          alt=""
          width={40}
          height={40}
          className="size-10 shrink-0 border border-border object-cover"
          unoptimized
        />
        <div className="min-w-0">
          <p className="m-0 truncate text-sm font-semibold text-foreground">
            @{record.owner.github}
          </p>
          <p className="m-0 mt-1 text-sm text-muted-foreground">
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
          className="mt-0.5 size-4 shrink-0 text-success"
          aria-hidden="true"
        />
        <span>
          <span className="font-mono font-semibold">
            {subdomain}.is-pinoy.dev
          </span>{" "}
          is available.
        </span>
      </div>
      <Button asChild size="sm">
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
      setStatus("error")
      return
    }

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
        setRecord((await res.json()) as SubdomainRecord)
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

  return (
    <section
      id="claim"
      className="border border-border bg-surface-subtle p-6 sm:p-8"
      aria-labelledby="checker-title"
    >
      <p
        id="checker-title"
        className="m-0 font-mono text-xs font-semibold tracking-[0.12em] text-accent uppercase"
      >
        Check availability
      </p>
      <div className="mt-5">
        <InputGroup>
          <Input
            type="text"
            aria-label="Subdomain name"
            value={value}
            onChange={(event) => {
              setValue(event.target.value)
              if (status !== "idle") setStatus("idle")
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") void handleCheck()
            }}
            placeholder="yourname"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-auto flex-1 border-0 bg-transparent px-4 py-4 font-mono text-base shadow-none focus-visible:ring-0"
          />
          <InputGroupAddon className="font-mono text-sm sm:text-base">
            .is-pinoy.dev
          </InputGroupAddon>
        </InputGroup>
        <p className="m-0 mt-2 text-xs leading-5 text-muted-foreground">
          Use letters, numbers, and hyphens. No spaces.
        </p>
        <Button
          type="button"
          size="lg"
          className="mt-5 w-full"
          onClick={() => void handleCheck()}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Checking…" : "Check availability"}
          {status !== "loading" && <ArrowUpRight aria-hidden="true" />}
        </Button>
      </div>

      <div className="mt-5" aria-live="polite">
        {(status === "taken" ||
          status === "available" ||
          status === "error") && (
          <ResultPanel
            status={status}
            subdomain={checkedSubdomain}
            record={record}
          />
        )}
      </div>
    </section>
  )
}
