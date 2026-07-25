"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { ArrowUpRight, UserRound } from "lucide-react"
import { cn } from "@is-pinoy-dev/ui/lib/utils"
import {
  NETWORK_LOCATIONS,
  type CommunityProfile,
} from "@/lib/community-profiles"
import { PHILIPPINES_MAP_POINTS } from "@/lib/philippines-map-points"

const SEQUENCE_INTERVAL = 5600

function DeveloperCard({
  profile,
  locationIndex,
  active,
  onActiveChange,
}: {
  profile: CommunityProfile
  locationIndex: number
  active: boolean
  onActiveChange: (id: string | null) => void
}) {
  const location = NETWORK_LOCATIONS[locationIndex % NETWORK_LOCATIONS.length]!

  return (
    <a
      href={profile.profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "network-card absolute z-20 w-[178px] border border-border bg-card p-3.5 text-foreground no-underline shadow-[0_12px_34px_rgba(11,31,68,0.10)] transition-[opacity,transform,border-color] duration-500 outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        location.cardSide === "left"
          ? "right-[60%] sm:right-[64%]"
          : "left-[58%] sm:left-[62%]",
        active
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      )}
      style={{
        top: `${Math.max(7, Math.min(72, location.coordinates.y / 5 - 10))}%`,
      }}
      tabIndex={active ? 0 : -1}
      onMouseEnter={() => onActiveChange(profile.id)}
      onMouseLeave={() => onActiveChange(null)}
      onFocus={() => onActiveChange(profile.id)}
      onBlur={() => onActiveChange(null)}
      aria-label={`Visit ${profile.subdomain}, claimed by ${profile.github} on GitHub`}
    >
      <span className="mb-3 flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt=""
          aria-hidden="true"
          width="32"
          height="32"
          loading="lazy"
          className="size-8 border border-border bg-secondary object-cover"
        />
        <ArrowUpRight className="size-4 text-accent" aria-hidden="true" />
      </span>
      <strong className="block text-sm font-semibold">
        {profile.subdomain}
      </strong>
      <span className="mt-1 block text-xs text-muted-foreground">
        @{profile.github}
      </span>
      <span className="mt-2 flex items-center gap-1 font-mono text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        <UserRound className="size-3 text-primary-dark" aria-hidden="true" />
        Claimed subdomain
      </span>
    </a>
  )
}

export function PhilippinesNetwork({
  profiles,
}: {
  profiles: CommunityProfile[]
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(
      () => setHasEntered(true),
      reduceMotion ? 0 : 2100
    )
    return () => window.clearTimeout(timer)
  }, [reduceMotion])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting ?? false),
      { threshold: 0.12 }
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reduceMotion || !isVisible || focusedId) return
    const timer = window.setInterval(
      () =>
        setActiveIndex((index) => {
          if (profiles.length < 2) return 0
          const offset = 1 + Math.floor(Math.random() * (profiles.length - 1))
          return (index + offset) % profiles.length
        }),
      SEQUENCE_INTERVAL
    )
    return () => window.clearInterval(timer)
  }, [focusedId, isVisible, profiles.length, reduceMotion])

  const visibleProfile = focusedId
    ? profiles.find((profile) => profile.id === focusedId)
    : profiles[activeIndex]
  const visibleIndex = visibleProfile
    ? profiles.findIndex((profile) => profile.id === visibleProfile.id)
    : -1

  return (
    <div
      ref={rootRef}
      className={cn(
        "network-root relative mx-auto aspect-[4/5] w-full max-w-[500px]",
        !isVisible && "network-paused"
      )}
    >
      <p className="absolute top-4 right-2 z-10 m-0 font-mono text-[10px] font-semibold tracking-[0.12em] text-accent uppercase sm:right-5">
        Across the islands
      </p>

      <svg
        className="absolute inset-0 size-full overflow-visible"
        viewBox="-90 -25 500 550"
        role="img"
        aria-label="A dotted map of the Philippines with illustrative network nodes across Luzon, Visayas, and Mindanao."
      >
        <g className="network-connections" aria-hidden="true">
          <path d="M123 143 L135 197 L231 327 L288 425" />
          <path className="network-travel" d="M135 197 L231 327" />
        </g>
        <g aria-hidden="true">
          {PHILIPPINES_MAP_POINTS.map(([x, y], index) => (
            <circle
              key={`${x}-${y}`}
              className={cn("map-dot", index % 17 === 3 && "map-dot-accent")}
              cx={x}
              cy={y}
              r="2.15"
              style={{ "--dot-index": index } as CSSProperties}
            />
          ))}
        </g>
        <g aria-hidden="true">
          {NETWORK_LOCATIONS.map((location, index) => {
            const active =
              hasEntered && visibleIndex % NETWORK_LOCATIONS.length === index
            return (
              <g
                key={location.id}
                className={cn("active-node", active && "is-active")}
              >
                <circle
                  className="node-pulse"
                  cx={location.coordinates.x}
                  cy={location.coordinates.y}
                  r="9"
                />
                <circle
                  className="node-ring"
                  cx={location.coordinates.x}
                  cy={location.coordinates.y}
                  r="5"
                />
                <circle
                  className="node-core"
                  cx={location.coordinates.x}
                  cy={location.coordinates.y}
                  r="2.6"
                />
              </g>
            )
          })}
        </g>
      </svg>

      {profiles.map((profile, index) => (
        <DeveloperCard
          key={profile.id}
          profile={profile}
          locationIndex={index}
          active={hasEntered && visibleProfile?.id === profile.id}
          onActiveChange={setFocusedId}
        />
      ))}

      {profiles.length === 0 && (
        <p className="absolute inset-x-10 bottom-14 m-0 border border-border bg-card p-3 text-center text-xs text-muted-foreground">
          Community profiles will appear when registry data is available.
        </p>
      )}

      <span className="absolute right-2 bottom-3 font-mono text-[10px] text-muted-foreground sm:right-5">
        7°–18° N · connected by community
      </span>
    </div>
  )
}
