const GITHUB_URL =
  "https://api.github.com/repos/is-pinoy-dev/domains/contents/subdomains";

interface GitHubEntry {
  name: string;
  type: string;
}

export async function fetchSubdomains(): Promise<string[]> {
  const res = await fetch(GITHUB_URL, {
    headers: { "User-Agent": "is-pinoy.dev status worker" },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const files = (await res.json()) as GitHubEntry[];
  return files
    .filter((f) => f.type === "file" && f.name.endsWith(".json"))
    .map((f) => f.name.replace(/\.json$/, ""));
}
