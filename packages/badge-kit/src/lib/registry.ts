export interface RegistryEnv {
  CLOUDFLARE_API_TOKEN: string
  CLOUDFLARE_ZONE_ID: string
}

interface DnsListResponse {
  success: boolean
  result: Array<{ id: string; type: string }>
}

export async function isSubdomainRegistered(
  subdomain: string,
  env: RegistryEnv
): Promise<boolean> {
  const url = `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/dns_records?type=TXT&name=${subdomain}.is-pinoy.dev`

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })

    const json = (await res.json()) as DnsListResponse
    return json.success && json.result.length > 0
  } catch {
    return false
  }
}
