import { initWasm as initResvg, Resvg } from '@resvg/resvg-wasm'
import resvgWasm from '@resvg/resvg-wasm/index_bg.wasm'
import encodeWebp, { init as initWebpEnc } from '@jsquash/webp/encode'
import webpEncWasm from '@jsquash/webp/codec/enc/webp_enc_simd.wasm'

let resvgReady = false
let webpReady = false

async function ensureResvg(): Promise<void> {
  if (!resvgReady) {
    await initResvg(resvgWasm)
    resvgReady = true
  }
}

async function ensureWebp(): Promise<void> {
  if (!webpReady) {
    // initWebpEnc types are incomplete — actual signature is (module, options?)
    await (initWebpEnc as unknown as (m: WebAssembly.Module) => Promise<void>)(webpEncWasm)
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
