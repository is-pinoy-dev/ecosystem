import { copyFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const toolRoot = join(__dirname, "..");

// Resolve the wasm file from the installed package
const wasmSrc = resolve(toolRoot, "node_modules/@resvg/resvg-wasm/index_bg.wasm");
const publicDir = join(toolRoot, "public");
const wasmDest = join(publicDir, "resvg.wasm");

if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

copyFileSync(wasmSrc, wasmDest);
console.log("✓ Copied resvg.wasm to public/");

const workerDir = join(toolRoot, "worker");
const wasmWorkerDest = join(workerDir, "resvg.wasm");

if (!existsSync(workerDir)) mkdirSync(workerDir, { recursive: true });

copyFileSync(wasmSrc, wasmWorkerDest);
console.log("✓ Copied resvg.wasm to worker/");
