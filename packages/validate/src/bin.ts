#!/usr/bin/env node
import { createRequire } from "module"
import { readFileSync } from "fs"
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

let json: unknown
try {
  json = JSON.parse(readFileSync(file, "utf-8"))
} catch {
  console.error(pc.red(`✖ Could not read file: ${file}`))
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
