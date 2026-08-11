/**
 * Shorten a count the way GitHub itself does — `999`, `1.2k`, `12k`, `1.3m`.
 *
 * Star and follower counts are laid out in tight places: a tabular column in
 * the grid design, a fixed stat slot in bento and noir, a chip beside a repo
 * name. A five-digit number widens the column it sits in and pushes the row's
 * other cells out of alignment, so anything past a thousand is abbreviated.
 *
 * Deliberately not `Intl.NumberFormat`'s compact notation: that renders `1.2K`
 * with a capital K and varies by locale, and these strings are laid out to a
 * fixed width in the designs that use them.
 */
const SUFFIXES = ["", "k", "m", "b"] as const

export function compactCount(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0"

  let scaled = Math.trunc(value)
  let tier = 0
  while (scaled >= 1000 && tier < SUFFIXES.length - 1) {
    scaled /= 1000
    tier += 1
  }

  // One decimal under ten (1.2k), none above it (12k).
  const shown = scaled < 10 ? Math.round(scaled * 10) / 10 : Math.round(scaled)
  // Rounding can carry a value into the next unit: 999_999 scales to 1000k,
  // which is one million by another name.
  if (shown >= 1000 && tier < SUFFIXES.length - 1) return `1${SUFFIXES[tier + 1]}`
  return `${shown}${SUFFIXES[tier]}`
}
