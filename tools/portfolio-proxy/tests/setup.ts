// `HTMLRewriter` is ambient in the Workers runtime, so worker/index.ts uses
// the global directly and imports nothing — exactly as it runs in production.
// Plain Node has no such global, so this test-only setup file polyfills it
// with `htmlrewriter` (the same `lol-html` engine Cloudflare's own
// implementation is built on, packaged for Node) before any test file runs.
import { HTMLRewriter } from "htmlrewriter"

Object.assign(globalThis, { HTMLRewriter })
