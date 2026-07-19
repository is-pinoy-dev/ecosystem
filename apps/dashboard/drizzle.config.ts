import { defineConfig } from "drizzle-kit"

// D1 over HTTP: drizzle-kit talks to the same Cloudflare REST API the app uses,
// so migrations run without a Worker or a local SQLite file.
export default defineConfig({
  dialect: "sqlite",
  driver: "d1-http",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID ?? "",
    databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID ?? "",
    token: process.env.CLOUDFLARE_D1_API_TOKEN ?? "",
  },
})
