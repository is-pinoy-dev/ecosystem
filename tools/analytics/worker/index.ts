import { fetchSubdomains } from "./src/github";
import { fetchAnalytics } from "./src/graphql";
import { persistSnapshots } from "./src/db";

export interface Env {
  ANALYTICS_DB: D1Database;
  CF_API_TOKEN: string;
  CF_ZONE_ID: string;
}

function yesterday(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default {
  async scheduled(_event: ScheduledController, env: Env, _ctx: ExecutionContext): Promise<void> {
    const date = yesterday();

    const subdomains = await fetchSubdomains();
    if (subdomains.length === 0) {
      throw new Error("Empty subdomain list from GitHub — aborting to avoid data loss");
    }

    const rows = await fetchAnalytics(env.CF_API_TOKEN, env.CF_ZONE_ID, date);
    await persistSnapshots(env.ANALYTICS_DB, subdomains, rows, date);
  },
} satisfies ExportedHandler<Env>;
