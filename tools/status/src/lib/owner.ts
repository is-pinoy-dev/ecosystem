// Fetches PUBLIC owner info from the domains registry. Never reads owner.email.
export interface OwnerInfo {
  github: string;
  recordType: string | null;
}

interface RegistryRecord {
  owner?: { github?: string };
  records?: Record<string, unknown>;
}

const RAW_BASE =
  "https://raw.githubusercontent.com/is-pinoy-dev/domains/main/subdomains";

export function parseOwner(json: unknown): OwnerInfo | null {
  const data = (json ?? {}) as RegistryRecord;
  const github = data.owner?.github;
  if (typeof github !== "string" || github.length === 0) return null;
  const records = data.records;
  const recordType =
    records && typeof records === "object"
      ? (Object.keys(records)[0] ?? null)
      : null;
  return { github, recordType };
}

export async function fetchOwnerInfo(
  subdomain: string
): Promise<OwnerInfo | null> {
  try {
    const res = await fetch(`${RAW_BASE}/${subdomain}.json`, {
      headers: { "User-Agent": "is-pinoy.dev status worker" },
    });
    if (!res.ok) return null;
    return parseOwner(await res.json());
  } catch {
    return null;
  }
}
