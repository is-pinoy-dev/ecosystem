export type CommunityProfile = {
  id: string
  subdomain: string
  github: string
  avatarUrl: string
  profileUrl: string
}

export const NETWORK_LOCATIONS = [
  { id: "north-luzon", coordinates: { x: 123, y: 143 }, cardSide: "right" },
  { id: "metro-manila", coordinates: { x: 135, y: 197 }, cardSide: "left" },
  { id: "central-visayas", coordinates: { x: 231, y: 327 }, cardSide: "left" },
  {
    id: "southern-mindanao",
    coordinates: { x: 288, y: 425 },
    cardSide: "left",
  },
] as const
