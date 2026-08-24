#!/usr/bin/env node
// Which of the three D1 variables is wrong?
//
// Cloudflare answers a revoked token, a token from another account, a token
// without the D1 permission, and a mistyped account id with the same three
// words: "Authentication error". The dashboard can only report what it is
// told, so the answer has to come from asking the API narrower questions than
// "run this query" — which is what this does, one credential at a time:
//
//   1. is the token itself valid and active?          /user/tokens/verify
//   2. may it see D1 on this account?                 /accounts/:id/d1/database
//   3. is the configured database one of those?       (compare ids)
//   4. does a real query run end to end?              /query
//
// The first step that fails names the variable to fix. Nothing here writes.
//
//   pnpm --filter dashboard db:check
//
// Reads .env.local then .env from apps/dashboard, so it sees exactly what
// `next dev` would; on a deployment, run it with the variables exported.

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
// Imported rather than taken as a global: the app's ESLint config assumes a
// browser and does not know about one here.
import process from "node:process"
import { fileURLToPath } from "node:url"

const APP_DIR = join(dirname(fileURLToPath(import.meta.url)), "..")
const API = "https://api.cloudflare.com/client/v4"

/** Mirrors readEnv() in lib/db/env.ts — same trimming, same unquoting. */
function normalize(raw) {
  if (raw === undefined) return undefined
  let value = raw.trim()
  const quoted =
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  if (quoted) value = value.slice(1, -1).trim()
  return value === "" ? undefined : value
}

/** Enough of dotenv to read a KEY=value file; `next dev` does the rest. */
function loadEnvFile(name) {
  let contents
  try {
    contents = readFileSync(join(APP_DIR, name), "utf8")
  } catch {
    return
  }
  for (const line of contents.split("\n")) {
    const match = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(
      line
    )
    if (!match) continue
    const [, key, value] = match
    // Real environment wins: this is a fallback for local runs, not an override.
    if (process.env[key] === undefined) process.env[key] = value
  }
}

const ok = (message) => console.log(`  ✓ ${message}`)
const bad = (message) => console.log(`  ✗ ${message}`)
const note = (message) => console.log(`    ${message}`)

function fail(message, ...hints) {
  bad(message)
  for (const hint of hints) note(hint)
  console.log(
    "\nD1 is unreachable with these values — the dashboard will serve the registry from GitHub."
  )
  process.exit(1)
}

function mask(id) {
  return id.length <= 12 ? id : `${id.slice(0, 4)}…${id.slice(-4)}`
}

async function callApi(path, init) {
  const res = await fetch(`${API}${path}`, init)
  let body
  try {
    body = await res.json()
  } catch {
    body = undefined
  }
  const errors = (body?.errors ?? [])
    .map((e) => `${e.message}${e.code ? ` (code ${e.code})` : ""}`)
    .join("; ")
  return { res, body, errors: errors || `HTTP ${res.status}` }
}

loadEnvFile(".env.local")
loadEnvFile(".env")

const raw = {
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_D1_DATABASE_ID: process.env.CLOUDFLARE_D1_DATABASE_ID,
  CLOUDFLARE_D1_API_TOKEN: process.env.CLOUDFLARE_D1_API_TOKEN,
}
const accountId = normalize(raw.CLOUDFLARE_ACCOUNT_ID)
const databaseId = normalize(raw.CLOUDFLARE_D1_DATABASE_ID)
const token = normalize(raw.CLOUDFLARE_D1_API_TOKEN)

console.log("Checking the dashboard's D1 credentials\n")
console.log("Environment")

const missing = [
  !accountId && "CLOUDFLARE_ACCOUNT_ID",
  !databaseId && "CLOUDFLARE_D1_DATABASE_ID",
  !token && "CLOUDFLARE_D1_API_TOKEN",
].filter(Boolean)

if (missing.length > 0) {
  bad(`not set: ${missing.join(", ")}`)
  note("All three are required; with any of them unset the dashboard reads")
  note("the registry from the GitHub API instead, which is the documented")
  note("fallback rather than a fault. See .env.example.")
  process.exit(1)
}

for (const [name, value] of Object.entries(raw)) {
  if (value !== normalize(value)) {
    bad(`${name} has surrounding whitespace or quotes in the stored value`)
    note("The app strips it, but the copy in the deployment should be fixed —")
    note("other tools reading it (drizzle-kit, wrangler) do not.")
  }
}
ok(`account ${mask(accountId)}, database ${mask(databaseId)}, token set`)

if (!/^[0-9a-f]{32}$/i.test(accountId)) {
  bad("CLOUDFLARE_ACCOUNT_ID is not 32 hex characters — likely the wrong value")
}
if (
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    databaseId
  )
) {
  bad("CLOUDFLARE_D1_DATABASE_ID is not a UUID — likely the wrong value")
}

const auth = { Authorization: `Bearer ${token}` }

console.log("\n1. Token")
{
  const { res, body, errors } = await callApi("/user/tokens/verify", {
    headers: auth,
  })
  if (!res.ok || !body?.success) {
    fail(
      `Cloudflare rejected the token: ${errors}`,
      "CLOUDFLARE_D1_API_TOKEN is invalid, expired, or was revoked.",
      "Mint a new one at https://dash.cloudflare.com/profile/api-tokens with",
      "Account → D1 → Edit, then update it everywhere it is stored: the Vercel",
      "project, the 'Production – is-pinoy-dev-dashboard' GitHub Environment",
      "(used by .github/workflows/migrate-dashboard-db.yml), and .env.local."
    )
  }
  ok(`valid and ${body.result?.status ?? "active"}`)
}

console.log("\n2. D1 access to this account")
let databases
{
  const { res, body, errors } = await callApi(
    `/accounts/${accountId}/d1/database`,
    { headers: auth }
  )
  if (!res.ok || !body?.success) {
    fail(
      `Cannot list D1 databases for account ${mask(accountId)}: ${errors}`,
      "The token is valid but cannot read D1 here. Either it lacks the",
      "Account → D1 → Edit permission, or it was issued for a different",
      "account than CLOUDFLARE_ACCOUNT_ID names. Both look identical from the",
      "app: 'Authentication error'."
    )
  }
  databases = body.result ?? []
  ok(`token can read D1 — ${databases.length} database(s) in this account`)
}

console.log("\n3. The configured database")
{
  const match = databases.find((db) => db.uuid === databaseId)
  if (!match) {
    bad(`no database with id ${mask(databaseId)} in account ${mask(accountId)}`)
    for (const db of databases) note(`${db.name}: ${db.uuid}`)
    fail(
      "CLOUDFLARE_D1_DATABASE_ID does not name a database this account owns",
      "Copy the id of the intended database from the list above (dashboard-db,",
      "unless this deployment is a preview against another one)."
    )
  }
  ok(`${match.name} (${mask(databaseId)})`)
}

console.log("\n4. Query")
{
  const { res, body, errors } = await callApi(
    `/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({
        sql: "SELECT COUNT(*) AS n FROM subdomains",
        params: [],
      }),
    }
  )
  if (!res.ok || !body?.success) {
    if (/no such table/i.test(errors)) {
      fail(
        `The database is reachable but empty: ${errors}`,
        "The credentials are correct — the schema has never been applied to",
        "this database. Run: pnpm --filter dashboard db:migrate"
      )
    }
    fail(
      `The query was refused: ${errors}`,
      "The token can list this database but not query it — check that its",
      "D1 permission is Edit rather than a narrower one."
    )
  }
  const rows = body.result?.[0]?.results ?? []
  ok(`subdomains table readable — ${rows[0]?.n ?? 0} row(s)`)
}

console.log(
  "\nAll checks passed. The dashboard will read the registry from D1."
)
