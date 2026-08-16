import { ScreenshotError } from "./errors"
import type { StoredCapture } from "./types"

export interface ScreenshotStorage {
  put(
    portfolioId: string,
    version: number,
    capture: StoredCapture
  ): Promise<{ key: string; url: string }>
}

export function screenshotObjectKey(
  portfolioId: string,
  version: number
): string {
  return `showcase/${portfolioId}/preview-v${version}.jpeg`
}

export function publicScreenshotUrl(baseUrl: string, key: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${key}`
}

export class R2ScreenshotStorage implements ScreenshotStorage {
  constructor(
    private readonly bucket: R2Bucket,
    private readonly publicBaseUrl: string
  ) {}

  async put(
    portfolioId: string,
    version: number,
    capture: StoredCapture
  ): Promise<{ key: string; url: string }> {
    const key = screenshotObjectKey(portfolioId, version)
    try {
      await this.bucket.put(key, capture.bytes, {
        httpMetadata: {
          contentType: capture.contentType,
          cacheControl: "public, max-age=31536000, immutable",
        },
        customMetadata: {
          portfolioId,
          screenshotVersion: String(version),
        },
      })
    } catch {
      throw new ScreenshotError("upload_failure")
    }
    return { key, url: publicScreenshotUrl(this.publicBaseUrl, key) }
  }
}
