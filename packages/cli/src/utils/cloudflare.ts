export interface CloudflareCreds {
  apiToken: string;
  zoneId: string;
}

export function resolveCloudflareCreds(options: {
  apiKey?: string;
  zoneId?: string;
}): CloudflareCreds {
  if (options.apiKey) {
    console.warn(
      "Warning: --api-key is visible to all users in process listings. " +
      "Use the CLOUDFLARE_API_TOKEN environment variable instead.",
    );
  }

  const apiToken = options.apiKey ?? process.env.CLOUDFLARE_API_TOKEN;
  const zoneId = options.zoneId ?? process.env.CLOUDFLARE_ZONE_ID;

  if (!apiToken) {
    throw new Error(
      "CLOUDFLARE_API_TOKEN is required. Set it as an env var or pass --api-key.",
    );
  }
  if (!zoneId) {
    throw new Error(
      "CLOUDFLARE_ZONE_ID is required. Set it as an env var or pass --zone-id.",
    );
  }

  return { apiToken, zoneId };
}

export function setCloudflareEnv(creds: CloudflareCreds): void {
  process.env.CLOUDFLARE_API_TOKEN = creds.apiToken;
  process.env.CLOUDFLARE_ZONE_ID = creds.zoneId;
}
