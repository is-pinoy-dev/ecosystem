export interface ManualRefreshPolicyInput {
  actorLogin: string
  ownerGithub: string
  isAdmin?: boolean
  screenshotRequestedAt: Date | null
  now: Date
  cooldownHours: number
}

export type ManualRefreshPolicyResult =
  | { allowed: true }
  | {
      allowed: false
      reason: "unauthorized" | "cooldown"
      retryAfterSeconds?: number
    }

export function manualRefreshPolicy(
  input: ManualRefreshPolicyInput
): ManualRefreshPolicyResult {
  const ownsPortfolio =
    input.actorLogin.toLowerCase() === input.ownerGithub.toLowerCase()
  if (!ownsPortfolio && !input.isAdmin) {
    return { allowed: false, reason: "unauthorized" }
  }

  if (input.screenshotRequestedAt) {
    const availableAt =
      input.screenshotRequestedAt.getTime() +
      input.cooldownHours * 60 * 60 * 1000
    if (availableAt > input.now.getTime()) {
      return {
        allowed: false,
        reason: "cooldown",
        retryAfterSeconds: Math.ceil(
          (availableAt - input.now.getTime()) / 1000
        ),
      }
    }
  }

  return { allowed: true }
}
