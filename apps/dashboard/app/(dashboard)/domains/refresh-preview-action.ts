"use server"

import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { auth } from "@/auth"
import { getDb, hasDatabase } from "@/lib/db"
import { subdomains } from "@/lib/db/schema"
import {
  enqueueScreenshotJobs,
  ScreenshotWorkerError,
} from "@/lib/screenshots/client"
import { manualRefreshPolicy } from "@/lib/screenshots/manual-refresh"

const portfolioIdSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/)

export interface RefreshPreviewState {
  ok: boolean
  message: string
  retryAfterSeconds?: number
}

const INITIAL_STATE: RefreshPreviewState = { ok: false, message: "" }

export async function refreshPortfolioPreview(
  _previousState: RefreshPreviewState = INITIAL_STATE,
  formData: FormData
): Promise<RefreshPreviewState> {
  void _previousState
  const session = await auth()
  if (!session?.user?.login) {
    return { ok: false, message: "Sign in to refresh this preview." }
  }
  if (!hasDatabase()) {
    return {
      ok: false,
      message: "Preview refresh is not available without the database.",
    }
  }

  const parsed = portfolioIdSchema.safeParse(formData.get("portfolioId"))
  if (!parsed.success) return { ok: false, message: "Invalid portfolio." }

  const portfolio = await getDb()
    .select({
      name: subdomains.name,
      ownerGithub: subdomains.ownerGithub,
      syncStatus: subdomains.syncStatus,
      screenshotRequestedAt: subdomains.screenshotRequestedAt,
    })
    .from(subdomains)
    .where(eq(subdomains.name, parsed.data))
    .get()

  if (!portfolio || portfolio.syncStatus !== "synced") {
    return { ok: false, message: "This portfolio is not active." }
  }

  const configuredCooldown = Number(
    process.env.PORTFOLIO_SCREENSHOT_MANUAL_COOLDOWN_HOURS ?? 24
  )
  const policy = manualRefreshPolicy({
    actorLogin: session.user.login,
    ownerGithub: portfolio.ownerGithub,
    screenshotRequestedAt: portfolio.screenshotRequestedAt,
    now: new Date(),
    cooldownHours:
      Number.isFinite(configuredCooldown) && configuredCooldown > 0
        ? configuredCooldown
        : 24,
  })

  if (!policy.allowed) {
    if (policy.reason === "unauthorized") {
      return {
        ok: false,
        message: "Only the portfolio owner can refresh this preview.",
      }
    }
    return {
      ok: false,
      message: "Preview refresh is available once every 24 hours.",
      retryAfterSeconds: policy.retryAfterSeconds,
    }
  }

  try {
    await enqueueScreenshotJobs([
      { portfolioId: portfolio.name, reason: "manual_refresh" },
    ])
    revalidatePath("/domains")
    revalidatePath(`/domains/${portfolio.name}`)
    return { ok: true, message: "Updating preview…" }
  } catch (error) {
    if (error instanceof ScreenshotWorkerError) {
      return {
        ok: false,
        message:
          error.status === 429
            ? "Preview refresh is available once every 24 hours."
            : error.message,
        retryAfterSeconds: error.retryAfterSeconds,
      }
    }
    return { ok: false, message: "Could not queue the preview refresh." }
  }
}
