import { initWasm as initResvg, Resvg } from '@resvg/resvg-wasm'
import encodeWebp, { init as initWebpEnc } from '@jsquash/webp/encode'

// Injected by Wrangler from wrangler.toml [wasm_modules]
declare const RESVG_WASM: WebAssembly.Module
declare const WEBP_ENC_WASM: WebAssembly.Module

let resvgReady = false
let webpReady = false

async function ensureResvg(): Promise<void> {
  if (!resvgReady) {
    await initResvg(RESVG_WASM)
    resvgReady = true
  }
}

async function ensureWebp(): Promise<void> {
  if (!webpReady) {
    await initWebpEnc(WEBP_ENC_WASM)
    webpReady = true
  }
}

export async function svgToPng(svg: string): Promise<Uint8Array> {
  await ensureResvg()
  const resvg = new Resvg(svg)
  return resvg.render().asPng()
}

export async function svgToWebp(svg: string): Promise<Uint8Array> {
  await ensureResvg()
  await ensureWebp()
  const resvg = new Resvg(svg)
  const rendered = resvg.render()
  const imageData = {
    data: new Uint8ClampedArray(rendered.pixels.buffer),
    width: rendered.width,
    height: rendered.height,
  }
  const buffer = await encodeWebp(imageData)
  return new Uint8Array(buffer)
}
