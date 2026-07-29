import { z } from "zod";

export const envSchema = z.object({
  CLOUDFLARE_API_TOKEN: z.string().min(1),
  CLOUDFLARE_ZONE_ID: z.string().min(1),
  DOMAIN: z.string().default("is-pinoy.dev"),
  // Name of the deployed Worker script that fronts hosted portfolios. Optional
  // on purpose: the CLI is published and run by the domains repo, so a sync
  // whose environment predates this feature must keep working — unset simply
  // means route reconciliation is skipped entirely.
  PORTFOLIO_WORKER: z.string().min(1).optional(),
});

type EnvVars = z.infer<typeof envSchema>;

export function env<K extends keyof EnvVars>(key: K): EnvVars[K] {
  const fieldSchema = envSchema.shape[key];
  const result = fieldSchema.safeParse(process.env[key]);
  if (!result.success) {
    throw new Error(
      `Missing required env var: ${key}. Set it in your environment or use --dotenv to load a .env file.`,
    );
  }
  return result.data as EnvVars[K];
}
