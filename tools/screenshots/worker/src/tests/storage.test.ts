import { describe, expect, it } from "vitest"

import {
  publicScreenshotUrl,
  R2ScreenshotStorage,
  screenshotObjectKey,
} from "../storage"

describe("R2 screenshot storage", () => {
  it("uses a versioned key and immutable HTTP metadata", async () => {
    const calls: {
      key: string
      value: unknown
      options: R2PutOptions
    }[] = []
    const bucket = {
      async put(key: string, value: unknown, options: R2PutOptions) {
        calls.push({ key, value, options })
        return {} as R2Object
      },
    } as unknown as R2Bucket
    const storage = new R2ScreenshotStorage(
      bucket,
      "https://screenshots.is-pinoy.dev/"
    )

    const result = await storage.put("juan", 7, {
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/jpeg",
    })

    expect(result).toEqual({
      key: "showcase/juan/preview-v7.jpeg",
      url: "https://screenshots.is-pinoy.dev/showcase/juan/preview-v7.jpeg",
    })
    expect(calls[0]?.options.httpMetadata).toEqual({
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000, immutable",
    })
  })

  it("keeps the object key as the canonical reference", () => {
    const key = screenshotObjectKey("maria", 2)
    expect(key).toBe("showcase/maria/preview-v2.jpeg")
    expect(publicScreenshotUrl("https://cdn.example/", key)).toBe(
      "https://cdn.example/showcase/maria/preview-v2.jpeg"
    )
  })
})
