import { z } from "zod";

export const envSchema = z.object({
  CLOUDFLARE_API_TOKEN: z.string().min(1),
  CLOUDFLARE_ZONE_ID: z.string().min(1),
  DOMAIN: z.string().default("is-pinoy.dev"),
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
