export type CommunityProfile = {
  id: string
  subdomain: string
  role: string
  city: string
  coordinates: { x: number; y: number }
  profileUrl: string
  cardPosition: "left" | "right"
}

// These are intentionally non-personal community placeholders. They describe
// regional activity without implying that a specific person is online.
export const COMMUNITY_PROFILES: CommunityProfile[] = [
  {
    id: "luzon",
    subdomain: "Luzon makers",
    role: "Community portfolios",
    city: "Baguio",
    coordinates: { x: 123, y: 143 },
    profileUrl: "/showcase",
    cardPosition: "right",
  },
  {
    id: "metro-manila",
    subdomain: "Metro Manila",
    role: "Open-source builders",
    city: "Manila",
    coordinates: { x: 135, y: 197 },
    profileUrl: "/showcase",
    cardPosition: "left",
  },
  {
    id: "visayas",
    subdomain: "Visayas makers",
    role: "Community projects",
    city: "Cebu",
    coordinates: { x: 231, y: 327 },
    profileUrl: "/showcase",
    cardPosition: "left",
  },
  {
    id: "mindanao",
    subdomain: "Mindanao makers",
    role: "Developer portfolios",
    city: "Davao",
    coordinates: { x: 288, y: 425 },
    profileUrl: "/showcase",
    cardPosition: "left",
  },
]
