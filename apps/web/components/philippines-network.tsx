"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import { ArrowUpRight, MapPin, Pause, Play, Radio } from "lucide-react"
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

const AREA_DETAILS = [
  {
    label: "North Luzon",
    shortLabel: "N. Luzon",
    coordinates: "17.4° N · 121.0° E",
    cameraScale: 1.18,
  },
  {
    label: "Metro Manila",
    shortLabel: "Manila",
    coordinates: "14.6° N · 121.0° E",
    cameraScale: 1.28,
  },
  {
    label: "Central Visayas",
    shortLabel: "Visayas",
    coordinates: "10.3° N · 123.9° E",
    cameraScale: 1.22,
  },
  {
    label: "South Mindanao",
    shortLabel: "Mindanao",
    coordinates: "7.2° N · 125.5° E",
    cameraScale: 1.15,
  },
] as const

function DeveloperCard({
  profile,
  areaIndex,
  onInteractingChange,
}: {
  profile: CommunityProfile
  areaIndex: number
  onInteractingChange: (interacting: boolean) => void
}) {
  const area = AREA_DETAILS[areaIndex]!

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
        className="network-card group block border border-border bg-card text-foreground no-underline outline-none focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={`Visit ${profile.subdomain} by ${profile.github}`}
      >
        <span className="flex items-center justify-between border-b border-border px-3 py-2 font-mono text-[9px] font-semibold tracking-[0.12em] uppercase">
          <span className="flex items-center gap-1.5 text-accent">
            <span className="network-live-dot size-1.5 bg-primary" />
            Community node
          </span>
          <span className="text-muted-foreground">0{areaIndex + 1} / 04</span>
        </span>

        <span className="flex items-center gap-3 px-3 py-3">
          <span className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatarUrl}
              alt=""
              aria-hidden="true"
              width="48"
              height="48"
              loading="lazy"
              className="size-12 border border-border bg-secondary object-cover"
            />
            <span
              className="absolute -right-1 -bottom-1 size-3 border-2 border-card bg-primary"
              aria-hidden="true"
            />
          </span>
          <span className="min-w-0 flex-1">
            <strong
              className="block truncate text-sm leading-tight font-semibold tracking-[-0.01em]"
              title={profile.subdomain}
            >
              {profile.subdomain}
            </strong>
            <span className="mt-1.5 block truncate font-mono text-[10px] leading-none text-muted-foreground">
              @{profile.github}
            </span>
          </span>
        </span>

        <span className="flex items-center justify-between border-t border-border px-3 py-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
            <MapPin
              className="size-3 shrink-0 text-accent"
              aria-hidden="true"
            />
            <span className="truncate">{area.label}</span>
          </span>
          <span className="flex items-center gap-1 font-mono text-[9px] font-semibold tracking-[0.08em] text-accent uppercase">
            Open
            <ArrowUpRight
              className="size-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </span>
        </span>
      </a>
    </div>
  )
}

function AreaSummaryCard({
  areaIndex,
  onInteractingChange,
}: {
  areaIndex: number
  onInteractingChange: (interacting: boolean) => void
}) {
  const area = AREA_DETAILS[areaIndex]!

  return (
    <div
      className="network-card-shell absolute z-30"
      onMouseEnter={() => onInteractingChange(true)}
      onMouseLeave={() => onInteractingChange(false)}
      onFocusCapture={() => onInteractingChange(true)}
      onBlurCapture={() => onInteractingChange(false)}
    >
      <div className="network-card border border-border bg-card text-foreground">
        <div className="flex items-center justify-between border-b border-border px-3 py-2 font-mono text-[9px] font-semibold tracking-[0.12em] uppercase">
          <span className="flex items-center gap-1.5 text-accent">
            <span className="network-live-dot size-1.5 bg-primary" />
            Area focus
          </span>
          <span className="text-muted-foreground">0{areaIndex + 1} / 04</span>
        </div>

        <div className="flex items-center gap-3 px-3 py-3">
          <span className="flex size-12 shrink-0 items-center justify-center border border-border bg-secondary text-accent">
            <MapPin className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <strong className="block text-sm leading-tight font-semibold tracking-[-0.01em]">
              {area.label}
            </strong>
            <span className="mt-1.5 block text-[10px] leading-snug text-muted-foreground">
              Discover the Filipino developer network across the islands.
            </span>
          </span>
        </div>

        <a
          href="/showcase"
          className="group flex items-center justify-between border-t border-border px-3 py-2 font-mono text-[9px] font-semibold tracking-[0.08em] text-accent uppercase no-underline outline-none hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
        >
          Explore community
          <ArrowUpRight
            className="size-3 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          />
        </a>
      </div>
    </div>
  )
}

export function PhilippinesNetwork({
  profiles,
}: {
  profiles: CommunityProfile[]
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [activeAreaIndex, setActiveAreaIndex] = useState(0)
  const [activeProfileIndex, setActiveProfileIndex] = useState<number | null>(
    profiles.length > 0 ? 0 : null
  )
  const [isVisible, setIsVisible] = useState(true)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [hasEntered, setHasEntered] = useState(false)
  const [manualPaused, setManualPaused] = useState(false)
  const [isInteracting, setIsInteracting] = useState(false)

  const activeArea = AREA_DETAILS[activeAreaIndex]!
  const activeLocation = NETWORK_LOCATIONS[activeAreaIndex]!
  const activeProfile =
    activeProfileIndex === null ? undefined : profiles[activeProfileIndex]
  const isPaused = manualPaused || isInteracting || !isVisible

  const navigateToArea = useCallback(
    (areaIndex: number) => {
      const profileIndexes = profiles.reduce<number[]>((indexes, _, index) => {
        if (index % NETWORK_LOCATIONS.length === areaIndex) indexes.push(index)
        return indexes
      }, [])

      setActiveAreaIndex(areaIndex)
      setActiveProfileIndex((currentIndex) => {
        if (profileIndexes.length === 0) return null
        const nextIndex = profileIndexes.find(
          (profileIndex) => profileIndex > (currentIndex ?? -1)
        )
        return nextIndex ?? profileIndexes[0]!
      })
    },
    [profiles]
  )

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
      navigateToArea((activeAreaIndex + 1) % NETWORK_LOCATIONS.length)
    }, SEQUENCE_INTERVAL)
    return () => window.clearInterval(timer)
  }, [activeAreaIndex, isPaused, navigateToArea, reduceMotion])

  const locationX = activeLocation.coordinates.x + MAP_X_OFFSET
  const locationY = activeLocation.coordinates.y
  const projectedX =
    MAP_CENTER.x + activeArea.cameraScale * (locationX - MAP_CENTER.x)
  const projectedY =
    MAP_CENTER.y + activeArea.cameraScale * (locationY - MAP_CENTER.y)
  const cameraX = CAMERA_FOCUS.x - projectedX
  const cameraY = CAMERA_FOCUS.y - projectedY
  const cameraStyle = {
    transform: `translate(${cameraX}px, ${cameraY}px) scale(${activeArea.cameraScale})`,
  } satisfies CSSProperties

  const profileCounts = AREA_DETAILS.map(
    (_, areaIndex) =>
      profiles.filter(
        (_, profileIndex) =>
          profileIndex % NETWORK_LOCATIONS.length === areaIndex
      ).length
  )

  const mapPath =
    "M123 143 C128 160 132 181 135 197 C149 252 196 289 231 327 C252 354 278 394 288 425"

  return (
    <div
      ref={rootRef}
      className={cn(
        "network-root relative mx-auto aspect-[4/5] w-full max-w-[500px] overflow-hidden border border-border bg-secondary/35",
        isPaused && "network-paused"
      )}
    >
      <div className="pointer-events-none absolute top-0 right-0 left-0 z-20 flex items-start justify-between p-3 sm:p-4">
        <div>
          <p className="m-0 flex items-center gap-2 font-mono text-[9px] font-semibold tracking-[0.14em] text-accent uppercase sm:text-[10px]">
            <Radio className="size-3" aria-hidden="true" />
            PH community signal
          </p>
          <p className="mt-1.5 mb-0 text-sm font-semibold tracking-[-0.01em] text-foreground">
            {activeArea.label}
          </p>
          <p className="mt-0.5 mb-0 font-mono text-[9px] text-muted-foreground">
            {activeArea.coordinates}
          </p>
        </div>
        <button
          type="button"
          className="pointer-events-auto flex size-10 items-center justify-center border border-border bg-card text-foreground transition-colors outline-none hover:border-accent hover:text-accent focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label={
            manualPaused ? "Resume map animation" : "Pause map animation"
          }
          aria-pressed={manualPaused}
          onClick={() => setManualPaused((paused) => !paused)}
        >
          {manualPaused ? (
            <Play className="size-3.5" aria-hidden="true" />
          ) : (
            <Pause className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 400 500"
        role="img"
        aria-label={`A three-dimensional dotted map of the Philippines, focused on ${activeArea.label}, with illustrative community network nodes.`}
      >
        <defs>
          <pattern
            id="network-isometric-grid"
            width="48"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <path
              className="network-grid-line"
              d="M0 12 24 0 48 12 24 24ZM0 12 24 24M48 12 24 24"
            />
          </pattern>
          <filter
            id="network-map-shadow"
            x="-30%"
            y="-30%"
            width="170%"
            height="180%"
          >
            <feDropShadow
              dx="5"
              dy="9"
              stdDeviation="6"
              floodColor="#0b1f44"
              floodOpacity="0.16"
            />
          </filter>
        </defs>

        <rect className="network-stage-fill" width="400" height="500" />
        <rect
          className="network-stage-grid"
          width="400"
          height="500"
          fill="url(#network-isometric-grid)"
        />

        <g className="network-orbits" aria-hidden="true">
          <ellipse cx="150" cy="263" rx="116" ry="45" />
          <ellipse cx="150" cy="263" rx="82" ry="31" />
          <path d="M31 263H49M251 263H269M150 215V227M150 299V311" />
        </g>

        <g className="map-camera" style={cameraStyle} aria-hidden="true">
          <g transform={`translate(${MAP_X_OFFSET} 0)`}>
            <g className="map-depth-layer" filter="url(#network-map-shadow)">
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
                  className={cn(
                    "map-dot",
                    index % 19 === 4 && "map-dot-accent"
                  )}
                  cx={x}
                  cy={y}
                  r={1.55 + (y / 500) * 0.62}
                  style={{ "--dot-index": index } as CSSProperties}
                />
              ))}
            </g>

            <g className="network-connections">
              <path className="network-route-base" d={mapPath} />
              <path className="network-route-travel" d={mapPath} />
            </g>

            <g>
              {NETWORK_LOCATIONS.map((location, index) => {
                const active = hasEntered && activeAreaIndex === index
                return (
                  <g
                    key={location.id}
                    className={cn("active-node", active && "is-active")}
                  >
                    <circle
                      className="node-pulse"
                      cx={location.coordinates.x}
                      cy={location.coordinates.y}
                      r="10"
                    />
                    <circle
                      className="node-shadow"
                      cx={location.coordinates.x + 2}
                      cy={location.coordinates.y + 4}
                      r="5.5"
                    />
                    <circle
                      className="node-ring"
                      cx={location.coordinates.x}
                      cy={location.coordinates.y}
                      r="5.5"
                    />
                    <circle
                      className="node-core"
                      cx={location.coordinates.x}
                      cy={location.coordinates.y}
                      r="2.5"
                    />
                  </g>
                )
              })}
            </g>
          </g>
        </g>

        <g
          className={cn("network-focus-link", hasEntered && "is-visible")}
          aria-hidden="true"
        >
          <circle cx="150" cy="260" r="17" />
          <circle cx="150" cy="260" r="3" />
          <path d="M160 255 C184 247 184 218 210 208" />
          <path d="M204 208H218" />
        </g>

        <g className="network-corners" aria-hidden="true">
          <path d="M12 30V12H30M370 12H388V30M388 470V488H370M30 488H12V470" />
        </g>
      </svg>

      {hasEntered && activeProfile && (
        <DeveloperCard
          key={`${activeAreaIndex}-${activeProfile.id}`}
          profile={activeProfile}
          areaIndex={activeAreaIndex}
          onInteractingChange={setIsInteracting}
        />
      )}

      {hasEntered && !activeProfile && (
        <AreaSummaryCard
          key={`area-${activeAreaIndex}`}
          areaIndex={activeAreaIndex}
          onInteractingChange={setIsInteracting}
        />
      )}

      <nav
        className="network-area-rail absolute right-3 bottom-3 left-3 z-40 grid grid-cols-4 border border-border bg-card sm:right-4 sm:bottom-4 sm:left-4"
        aria-label="Explore community map areas"
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
        onFocusCapture={() => setIsInteracting(true)}
        onBlurCapture={() => setIsInteracting(false)}
      >
        {AREA_DETAILS.map((area, areaIndex) => {
          const active = activeAreaIndex === areaIndex
          return (
            <button
              key={area.label}
              type="button"
              className={cn(
                "network-area-button relative min-h-14 overflow-hidden border-r border-border px-2 py-2 text-left outline-none last:border-r-0 hover:bg-secondary focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent",
                active && "is-active"
              )}
              aria-current={active ? "location" : undefined}
              aria-label={`Navigate to ${area.label}`}
              onClick={() => navigateToArea(areaIndex)}
            >
              <span className="flex items-center justify-between font-mono text-[8px] font-semibold tracking-[0.1em] text-muted-foreground">
                <span>0{areaIndex + 1}</span>
                <span>
                  {profiles.length > 0 ? profileCounts[areaIndex] : "—"}
                </span>
              </span>
              <span className="mt-1 block truncate text-[10px] font-semibold text-foreground sm:text-[11px]">
                <span className="sm:hidden">{area.shortLabel}</span>
                <span className="hidden sm:inline">{area.label}</span>
              </span>
              {active && (
                <span
                  key={`${activeAreaIndex}-${activeProfile?.id ?? "empty"}-${isPaused}`}
                  className="network-area-progress absolute right-0 bottom-0 left-0 h-0.5 origin-left bg-primary"
                  style={
                    {
                      "--sequence-duration": `${SEQUENCE_INTERVAL}ms`,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
