"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { ArrowUpRight } from "lucide-react"
import { cn } from "@is-pinoy-dev/ui/lib/utils"
import {
  NETWORK_LOCATIONS,
  type CommunityProfile,
} from "@/lib/community-profiles"
import { PHILIPPINES_MAP_POINTS } from "@/lib/philippines-map-points"

const SEQUENCE_INTERVAL = 6200
const MAP_X_OFFSET = 40
const MAP_CENTER = { x: 200, y: 250 }
const CAMERA_FOCUS = { x: 150, y: 260 }
const MAP_SKEW_DEGREES = -15
const MAP_Y_SCALE = 0.86

const AREA_COUNT = NETWORK_LOCATIONS.length

const AREA_DETAILS = [
  {
    label: "North Luzon",
    cameraScale: 1.34,
  },
  {
    label: "Metro Manila",
    cameraScale: 1.44,
  },
  {
    label: "Central Visayas",
    cameraScale: 1.39,
  },
  {
    label: "South Mindanao",
    cameraScale: 1.33,
  },
] as const

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b)
}

/**
 * The camera sweep and the profile rotation each advance by one per step, so
 * the pairing repeats only once both wrap together. Over a full cycle every
 * profile is featured the same number of times — nobody is skipped and nobody
 * hogs the card — while the camera keeps its steady area-by-area sweep.
 */
function countSequenceSteps(profileCount: number): number {
  if (profileCount === 0) return AREA_COUNT
  return (
    (AREA_COUNT * profileCount) /
    greatestCommonDivisor(AREA_COUNT, profileCount)
  )
}

function DeveloperCard({
  profile,
  onInteractingChange,
}: {
  profile: CommunityProfile
  onInteractingChange: (interacting: boolean) => void
}) {
  return (
    <div
      className="network-card-shell absolute z-30"
      onMouseEnter={() => onInteractingChange(true)}
      onMouseLeave={() => onInteractingChange(false)}
      onFocusCapture={() => onInteractingChange(true)}
      onBlurCapture={() => onInteractingChange(false)}
    >
      <a
        href={profile.profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="network-card group flex min-h-[68px] items-center gap-3 bg-card/95 p-3 text-foreground no-underline backdrop-blur-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={`Visit ${profile.subdomain} by ${profile.github}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt=""
          aria-hidden="true"
          width="44"
          height="44"
          loading="lazy"
          className="size-11 shrink-0 bg-secondary object-cover"
        />
        <span className="min-w-0 flex-1">
          <strong
            className="block truncate text-sm leading-tight font-semibold tracking-[-0.01em]"
            title={profile.subdomain}
          >
            {profile.subdomain}
          </strong>
          <span className="mt-1.5 block truncate font-mono text-[10px] text-muted-foreground">
            @{profile.github}
          </span>
        </span>
        <ArrowUpRight
          className="size-4 shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </a>
    </div>
  )
}

function AreaSummaryCard({
  onInteractingChange,
}: {
  onInteractingChange: (interacting: boolean) => void
}) {
  return (
    <div
      className="network-card-shell absolute z-30"
      onMouseEnter={() => onInteractingChange(true)}
      onMouseLeave={() => onInteractingChange(false)}
      onFocusCapture={() => onInteractingChange(true)}
      onBlurCapture={() => onInteractingChange(false)}
    >
      <a
        href="/showcase"
        className="network-card group flex min-h-[68px] items-center gap-3 bg-card/95 p-3 text-foreground no-underline backdrop-blur-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <span className="min-w-0 flex-1">
          <strong className="block truncate text-sm leading-tight font-semibold tracking-[-0.01em]">
            Explore community
          </strong>
          <span className="mt-1 block text-[10px] text-muted-foreground">
            Meet Filipino developers
          </span>
        </span>
        <ArrowUpRight
          className="size-4 shrink-0 text-accent transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      </a>
    </div>
  )
}

export function PhilippinesNetwork({
  profiles,
}: {
  profiles: CommunityProfile[]
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)

  const sequenceSteps = useMemo(
    () => countSequenceSteps(profiles.length),
    [profiles.length]
  )

  // The whole rotation is derived from `step`, so a given step always yields the
  // same area and the same profile: the card walks the roster in order instead
  // of stalling on a subset while the rest never get a turn.
  const activeAreaIndex = step % AREA_COUNT
  const activeArea = AREA_DETAILS[activeAreaIndex]!
  const activeLocation = NETWORK_LOCATIONS[activeAreaIndex]!
  const activeProfile =
    profiles.length === 0 ? undefined : profiles[step % profiles.length]
  const isPaused = isInteracting || !isVisible

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
      reduceMotion ? 0 : 520
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
    if (reduceMotion || isPaused) return
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % sequenceSteps)
    }, SEQUENCE_INTERVAL)
    return () => window.clearInterval(timer)
  }, [isPaused, reduceMotion, sequenceSteps])

  const locationX = activeLocation.coordinates.x + MAP_X_OFFSET
  const locationY = activeLocation.coordinates.y
  const skewRadians = (MAP_SKEW_DEGREES * Math.PI) / 180
  const perspectiveY = MAP_CENTER.y + MAP_Y_SCALE * (locationY - MAP_CENTER.y)
  const perspectiveX =
    MAP_CENTER.x +
    (locationX - MAP_CENTER.x) +
    Math.tan(skewRadians) * (perspectiveY - MAP_CENTER.y)
  const projectedX =
    MAP_CENTER.x + activeArea.cameraScale * (perspectiveX - MAP_CENTER.x)
  const projectedY =
    MAP_CENTER.y + activeArea.cameraScale * (perspectiveY - MAP_CENTER.y)
  const cameraX = CAMERA_FOCUS.x - projectedX
  const cameraY = CAMERA_FOCUS.y - projectedY
  const cameraStyle = {
    transform: `translate(${cameraX}px, ${cameraY}px) scale(${activeArea.cameraScale})`,
  } satisfies CSSProperties

  return (
    <div
      ref={rootRef}
      className={cn(
        "network-root relative mx-auto aspect-[4/5] w-full max-w-[500px] overflow-hidden bg-background",
        isPaused && "network-paused"
      )}
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 400 500"
        role="img"
        aria-label={`A three-dimensional dotted map of the Philippines, focused on ${activeArea.label}, with illustrative community network nodes.`}
      >
        <g className="map-camera" style={cameraStyle} aria-hidden="true">
          <g className="map-projection">
            <g transform={`translate(${MAP_X_OFFSET} 0)`}>
              <g className="map-depth-layer">
                {PHILIPPINES_MAP_POINTS.map(([x, y], index) => (
                  <circle
                    key={`depth-${x}-${y}`}
                    className="map-dot-depth"
                    cx={x + 2.8}
                    cy={y + 5.2}
                    r={1.8 + (y / 500) * 0.65}
                    style={{ "--dot-index": index } as CSSProperties}
                  />
                ))}
              </g>

              <g className="map-surface-layer">
                {PHILIPPINES_MAP_POINTS.map(([x, y], index) => (
                  <circle
                    key={`${x}-${y}`}
                    className="map-dot"
                    cx={x}
                    cy={y}
                    r={1.55 + (y / 500) * 0.62}
                    style={{ "--dot-index": index } as CSSProperties}
                  />
                ))}
              </g>

              <g className={cn("active-node", hasEntered && "is-active")}>
                <circle
                  className="node-pulse"
                  cx={activeLocation.coordinates.x}
                  cy={activeLocation.coordinates.y}
                  r="10"
                />
                <circle
                  className="node-shadow"
                  cx={activeLocation.coordinates.x + 2}
                  cy={activeLocation.coordinates.y + 4}
                  r="5.5"
                />
                <circle
                  className="node-ring"
                  cx={activeLocation.coordinates.x}
                  cy={activeLocation.coordinates.y}
                  r="5.5"
                />
                <circle
                  className="node-core"
                  cx={activeLocation.coordinates.x}
                  cy={activeLocation.coordinates.y}
                  r="2.5"
                />
              </g>
            </g>
          </g>
        </g>
      </svg>

      {hasEntered && activeProfile && (
        <DeveloperCard
          key={`${activeAreaIndex}-${activeProfile.id}`}
          profile={activeProfile}
          onInteractingChange={setIsInteracting}
        />
      )}

      {hasEntered && !activeProfile && (
        <AreaSummaryCard
          key={`area-${activeAreaIndex}`}
          onInteractingChange={setIsInteracting}
        />
      )}
    </div>
  )
}
