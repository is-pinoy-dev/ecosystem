const DOMAINS_RAW_BASE =
  'https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains'

interface SubdomainRecord {
  destroy?: boolean
}

export async function isSubdomainRegistered(subdomain: string): Promise<boolean> {
  const url = `${DOMAINS_RAW_BASE}/${subdomain}.json`

  try {
    const res = await fetch(url)
    if (!res.ok) return false

    const json = (await res.json()) as SubdomainRecord
    return json.destroy !== true
  } catch {
    return false
  }
}
