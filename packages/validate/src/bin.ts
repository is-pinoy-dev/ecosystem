#!/usr/bin/env node
import { createRequire } from "module"
import { readFileSync, lstatSync } from "fs"
import { fileURLToPath } from "url"
import { join, dirname } from "path"
import pc from "picocolors"
import type figletType from "figlet"
import { validateDomain } from "./validate.js"

const require = createRequire(import.meta.url)
const figlet = require("figlet") as typeof figletType

const __dirname = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8")) as { version: string }
const version = pkg.version

const MAX_FILE_SIZE = 64 * 1024 // 64 KB

function printBanner(): void {
  const art = figlet.textSync("IS-PINOY.dev", { font: "ANSI Shadow" })
  const lines = art.split("\n").filter((l) => l.trim().length > 0)

  console.log()
  for (const line of lines) {
    console.log("  " + pc.yellow(line))
  }
  console.log("  " + pc.dim("─".repeat(80)) + "  " + pc.dim(`v${version}`))
  console.log()
}

const file = process.argv[2]

if (!file) {
  printBanner()
  console.error(pc.red("✖ Usage: npx @is-pinoy-dev/validate <file>"))
  process.exit(1)
}

printBanner()

// Reject symlinks before reading to prevent symlink-based traversal attacks.
const stat = lstatSync(file, { throwIfNoEntry: false })
if (!stat) {
  console.error(pc.red(`✖ File not found: ${file}`))
  process.exit(1)
}
if (stat.isSymbolicLink()) {
  console.error(pc.red(`✖ Symlinks are not permitted: ${file}`))
  process.exit(1)
}
if (!stat.isFile()) {
  console.error(pc.red(`✖ Not a regular file: ${file}`))
  process.exit(1)
}
if (stat.size > MAX_FILE_SIZE) {
  console.error(pc.red(`✖ File too large (max ${MAX_FILE_SIZE} bytes): ${file}`))
  process.exit(1)
}

let json: unknown
try {
  json = JSON.parse(readFileSync(file, "utf-8"))
} catch {
  console.error(pc.red(`✖ Could not read or parse file: ${file}`))
  process.exit(1)
}

const result = validateDomain(json as Parameters<typeof validateDomain>[0])

if (!result.ok) {
  console.error(pc.red(`✖ Validation failed for ${pc.bold(file)}:`))
  result.errors.forEach((e) => console.error(pc.yellow(`  - ${e}`)))
  process.exit(1)
} else {
  console.log(pc.green(`✔ ${file} is valid`))
}
