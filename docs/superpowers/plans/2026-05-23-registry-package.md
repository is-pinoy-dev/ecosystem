# Registry Package Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the standalone `register` project into `packages/registry` in the ecosystem monorepo, using `@is-pinoy/schemas` instead of local Zod schemas.

**Architecture:** Library package with core modules (loader, validate, diff, sync) and a Cloudflare provider. CLI deferred to separate package. Uses pnpm workspace + Turborepo. ESM with NodeNext module resolution (imports require `.js` extensions).

**Tech Stack:** TypeScript 5.9, NodeNext module resolution, Zod 4, Vitest, pnpm workspaces, Turborepo

---

### Task 1: Scaffold package directory and config files

**Files:**
- Create: `packages/registry/package.json`
- Create: `packages/registry/tsconfig.json`
- Create: `packages/registry/eslint.config.js`
- Create: `packages/registry/vitest.config.ts`
- Create: `packages/registry/src/index.ts`
- Create: `packages/registry/src/reserved_subdomains.json`

- [ ] **Step 1: Create `packages/registry/package.json`**

```json
{
  "name": "@is-pinoy/registry",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "scripts": {
    "lint": "eslint",
    "format": "prettier --write \"**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@is-pinoy/schemas": "workspace:*",
    "dotenv": "^17.4.2",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@is-pinoy/eslint-config": "workspace:*",
    "@is-pinoy/typescript-config": "workspace:*",
    "eslint": "^9.39.2",
    "typescript": "^5.9.3",
    "vitest": "^3.1.3"
  },
  "exports": {
    ".": "./src/index.ts",
    "./core/*": "./src/core/*.ts",
    "./providers/*": "./src/providers/*.ts"
  }
}
```

- [ ] **Step 2: Create `packages/registry/tsconfig.json`**

```json
{
  "extends": "@is-pinoy/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `packages/registry/eslint.config.js`**

```js
import { config } from "@is-pinoy/eslint-config/base"

/** @type {import("eslint").Linter.Config} */
export default config
```

- [ ] **Step 4: Create `packages/registry/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 5: Create `packages/registry/src/index.ts`**

```ts
export * from "./core/loader.js";
export * from "./core/validate.js";
export * from "./core/diff.js";
export * from "./core/sync.js";
export * from "./providers/cloudflare/client.js";
```

- [ ] **Step 6: Create `packages/registry/src/reserved_subdomains.json`** (18 entries)

```json
[
  "www",
  ...
  "forum"
]

- [ ] **Step 7: Install dependencies**

Run: `pnpm install`
Expected: Packages linked successfully, no errors.

---

### Task 2: Write tests first (TDD — failing state)

**Files:**
- Create: `packages/registry/src/tests/validate.test.ts`
- Create: `packages/registry/src/tests/diff.test.ts`
- Create: `packages/registry/src/tests/sync.test.ts`

- [ ] **Step 1: Write `src/tests/validate.test.ts`**

```ts
import { describe, it, expect, vi } from "vitest";

vi.mock("../core/loader.js", () => ({
  loadDomains: vi.fn(),
}));

import { loadDomains } from "../core/loader.js";
import { validateDomains } from "../core/validate.js";

describe("validateDomains", () => {
  it("returns ok when all domains are valid", () => {
    vi.mocked(loadDomains).mockReturnValue([
      {
        subdomain: "jun",
        owner: { github: "bosquejun" },
        records: { CNAME: { value: "jun.vercel.app" } },
        file: "jun.json",
      },
    ]);

    const result = validateDomains();
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("reports duplicate subdomains", () => {
    vi.mocked(loadDomains).mockReturnValue([
      {
        subdomain: "jun",
        owner: { github: "a" },
        records: { CNAME: { value: "a.vercel.app" } },
        file: "jun.json",
      },
      {
        subdomain: "jun",
        owner: { github: "b" },
        records: { CNAME: { value: "b.vercel.app" } },
        file: "jun2.json",
      },
    ]);

    const result = validateDomains();
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Duplicate subdomain: jun");
  });

  it("reports filename mismatch", () => {
    vi.mocked(loadDomains).mockReturnValue([
      {
        subdomain: "jun",
        owner: { github: "bosquejun" },
        records: { CNAME: { value: "jun.vercel.app" } },
        file: "wrong.json",
      },
    ]);

    const result = validateDomains();
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Filename mismatch: jun.json vs wrong.json");
  });

  it("reports reserved subdomains", () => {
    vi.mocked(loadDomains).mockReturnValue([
      {
        subdomain: "www",
        owner: { github: "hacker" },
        records: { CNAME: { value: "evil.vercel.app" } },
        file: "www.json",
      },
    ]);

    const result = validateDomains();
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Reserved subdomain: www");
  });
});
```

- [ ] **Step 2: Write `src/tests/diff.test.ts`**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { diff } from "../core/diff.js";
import type { Domain, CloudflareRecord } from "@is-pinoy/schemas";

describe("diff", () => {
  beforeEach(() => {
    process.env.DOMAIN = "is-pinoy.dev";
  });

  it("creates missing DNS record", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "jun.vercel.app" } },
      },
    ];
    const actual: CloudflareRecord[] = [];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("CREATE");
  });

  it("updates changed DNS record", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "new.vercel.app" } },
      },
    ];
    const actual: CloudflareRecord[] = [
      { id: "123", name: "jun.is-pinoy.dev", type: "CNAME", content: "old.vercel.app" },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("UPDATE");
  });

  it("deletes removed DNS record when destroy is true", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "jun.vercel.app" } },
        destroy: true,
      },
    ];
    const actual: CloudflareRecord[] = [
      { id: "123", name: "jun.is-pinoy.dev", type: "CNAME", content: "jun.vercel.app" },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("DELETE");
  });

  it("does NOT delete when destroy is absent", () => {
    const desired: Domain[] = [];
    const actual: CloudflareRecord[] = [
      { id: "123", name: "jun.is-pinoy.dev", type: "CNAME", content: "jun.vercel.app" },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("does NOT delete when destroy is false", () => {
    const desired: Domain[] = [
      {
        subdomain: "jun",
        owner: { github: "jun" },
        records: { CNAME: { value: "jun.vercel.app" } },
        destroy: false,
      },
    ];
    const actual: CloudflareRecord[] = [
      { id: "123", name: "jun.is-pinoy.dev", type: "CNAME", content: "jun.vercel.app" },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("TXT records use _{provider}.{domain} naming", () => {
    const desired: Domain[] = [
      {
        subdomain: "test",
        owner: { github: "test" },
        records: { TXT: { value: "vc-domain-verify=test.is-pinoy.dev,abc123", provider: "vercel" } },
      },
    ];
    const actual: CloudflareRecord[] = [];
    const result = diff(desired, actual);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("CREATE");
    expect(result[0]?.fqdn).toBe("_vercel.is-pinoy.dev");
  });

  it("TXT records match existing _{provider}.{domain} records", () => {
    const desired: Domain[] = [
      {
        subdomain: "test",
        owner: { github: "test" },
        records: { TXT: { value: "vc-domain-verify=test.is-pinoy.dev,abc123", provider: "vercel" } },
      },
    ];
    const actual: CloudflareRecord[] = [
      { id: "456", name: "_vercel.is-pinoy.dev", type: "TXT", content: '"vc-domain-verify=test.is-pinoy.dev,abc123"' },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("TXT value without quotes matches Cloudflare value with quotes", () => {
    const desired: Domain[] = [
      {
        subdomain: "test",
        owner: { github: "test" },
        records: { TXT: { value: "vc-domain-verify=test.is-pinoy.dev,abc123", provider: "vercel" } },
      },
    ];
    const actual: CloudflareRecord[] = [
      { id: "456", name: "_vercel.is-pinoy.dev", type: "TXT", content: '"vc-domain-verify=test.is-pinoy.dev,abc123"' },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(0);
  });

  it("destroy deletes both CNAME and TXT records", () => {
    const desired: Domain[] = [
      {
        subdomain: "test",
        owner: { github: "test" },
        records: {
          CNAME: { value: "test.vercel.app" },
          TXT: { value: "vc-domain-verify=test.is-pinoy.dev,abc123", provider: "vercel" },
        },
        destroy: true,
      },
    ];
    const actual: CloudflareRecord[] = [
      { id: "1", name: "test.is-pinoy.dev", type: "CNAME", content: "test.vercel.app" },
      { id: "2", name: "_vercel.is-pinoy.dev", type: "TXT", content: '"vc-domain-verify=test.is-pinoy.dev,abc123"' },
    ];
    const result = diff(desired, actual);
    expect(result).toHaveLength(2);
    expect(result[0]?.type).toBe("DELETE");
    expect(result[1]?.type).toBe("DELETE");
  });
});
```

- [ ] **Step 3: Write `src/tests/sync.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../providers/cloudflare/client.js", () => ({
  createRecord: vi.fn(),
  updateRecord: vi.fn(),
  deleteRecord: vi.fn(),
}));

import { sync } from "../core/sync.js";
import * as cloudflare from "../providers/cloudflare/client.js";

describe("sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("handles CREATE action", async () => {
    vi.mocked(cloudflare.createRecord).mockResolvedValue({
      type: "CNAME",
      content: "jun.vercel.app",
      id: "1",
      name: "jun.is-pinoy.dev",
    });

    await sync([
      {
        type: "CREATE",
        fqdn: "jun.is-pinoy.dev",
        record: { type: "CNAME", value: "jun.vercel.app" },
      },
    ]);

    expect(cloudflare.createRecord).toHaveBeenCalledTimes(1);
    expect(cloudflare.createRecord).toHaveBeenCalledWith(
      { type: "CNAME", value: "jun.vercel.app" },
      "jun.is-pinoy.dev",
    );
  });

  it("handles UPDATE action", async () => {
    vi.mocked(cloudflare.updateRecord).mockResolvedValue({
      type: "CNAME",
      content: "new.vercel.app",
      id: "123",
      name: "jun.is-pinoy.dev",
    });

    await sync([
      {
        type: "UPDATE",
        id: "123",
        fqdn: "jun.is-pinoy.dev",
        record: { type: "CNAME", value: "new.vercel.app" },
      },
    ]);

    expect(cloudflare.updateRecord).toHaveBeenCalledTimes(1);
    expect(cloudflare.updateRecord).toHaveBeenCalledWith(
      "123",
      { type: "CNAME", value: "new.vercel.app" },
      "jun.is-pinoy.dev",
    );
  });

  it("handles DELETE action", async () => {
    vi.mocked(cloudflare.deleteRecord).mockResolvedValue({
      type: "CNAME",
      content: "jun.vercel.app",
      id: "123",
      name: "jun.is-pinoy.dev",
    });

    await sync([
      {
        type: "DELETE",
        id: "123",
        fqdn: "jun.is-pinoy.dev",
      },
    ]);

    expect(cloudflare.deleteRecord).toHaveBeenCalledTimes(1);
    expect(cloudflare.deleteRecord).toHaveBeenCalledWith("123");
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `pnpm --filter @is-pinoy/registry vitest run`
Expected: Tests fail with "Cannot find module" errors since core modules don't exist yet.

---

### Task 3: Implement Cloudflare client

**Files:**
- Create: `packages/registry/src/providers/cloudflare/client.ts`

- [ ] **Step 1: Create `src/providers/cloudflare/client.ts`**

```ts
import "dotenv/config";

import { type CloudflareRecord, type DNSRecord } from "@is-pinoy/schemas";

const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID!;

function normalizeContent(record: DNSRecord): string {
  if (record.type === "TXT") {
    const value = record.value;
    if (!value.startsWith('"') || !value.endsWith('"')) {
      return `"${value}"`;
    }
    return value;
  }
  return record.value;
}

async function cfRequest(
  path: string,
  method: string,
  body?: Record<string, unknown>,
): Promise<CloudflareRecord[] | CloudflareRecord> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
  );

  const json = (await res.json()) as {
    success: boolean;
    result: CloudflareRecord;
    errors: unknown[];
  };

  if (!json.success) {
    throw new Error(JSON.stringify(json.errors));
  }

  return json.result;
}

export async function createRecord<TRecord extends DNSRecord>(
  record: TRecord,
  fqdn: string,
) {
  return cfRequest("dns_records", "POST", {
    type: record.type,
    name: fqdn,
    content: normalizeContent(record),
    ttl: record.ttl ?? 1,
    proxied: "proxied" in record ? record.proxied : false,
  });
}

export async function updateRecord<TRecord extends DNSRecord>(
  id: string,
  record: TRecord,
  fqdn: string,
) {
  return cfRequest(`dns_records/${id}`, "PUT", {
    type: record.type,
    name: fqdn,
    content: normalizeContent(record),
    ttl: record.ttl ?? 1,
    proxied: "proxied" in record ? record.proxied : false,
  });
}

export async function deleteRecord(id: string) {
  return cfRequest(`dns_records/${id}`, "DELETE");
}

export async function listRecords() {
  return cfRequest("dns_records", "GET");
}
```

- [ ] **Step 2: Run tests to confirm progress**

Run: `pnpm --filter @is-pinoy/registry vitest run`
Expected: Fewer failures (sync.ts tests now try to import client, but other modules still missing).

---

### Task 4: Implement loader

**Files:**
- Create: `packages/registry/src/core/loader.ts`

- [ ] **Step 1: Create `src/core/loader.ts`**

```ts
import fs from "fs";
import path from "path";
import {
  domainSchema,
  resolvedDomainSchema,
  ResolvedDomainsSchema,
} from "@is-pinoy/schemas";
import type { ResolvedDomain, ResolvedDomains } from "@is-pinoy/schemas";

const DOMAIN_DIR = "domains";

export function loadDomains(dir: string = DOMAIN_DIR): ResolvedDomains {
  const files = fs.readdirSync(dir);

  const domains: ResolvedDomain[] = [];

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const json = JSON.parse(raw);

    const parsed = domainSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`Schema error in ${file}: ${parsed.error.message}`);
    }

    domains.push(
      resolvedDomainSchema.parse({
        ...parsed.data,
        file,
      }),
    );
  }

  return ResolvedDomainsSchema.parse(domains);
}
```

- [ ] **Step 2: Run tests**

Run: `pnpm --filter @is-pinoy/registry vitest run`
Expected: validate.ts tests now resolve imports but fail on missing validate module.

---

### Task 5: Implement validate

**Files:**
- Modify: `packages/registry/src/core/validate.ts`

- [ ] **Step 1: Create `src/core/validate.ts`**

```ts
import { loadDomains } from "./loader.js";
import reservedSubdomains from "../reserved_subdomains.json" with { type: "json" };

export function validateDomains(dir?: string) {
  const domains = loadDomains(dir);

  const errors: string[] = [];
  const seen = new Set<string>();

  for (const domain of domains) {
    const expectedFile = `${domain.subdomain}.json`;

    if (seen.has(domain.subdomain)) {
      errors.push(`Duplicate subdomain: ${domain.subdomain}`);
    }
    seen.add(domain.subdomain);

    if (expectedFile !== domain.file) {
      errors.push(`Filename mismatch: ${expectedFile} vs ${domain.file}`);
    }

    if (reservedSubdomains.includes(domain.subdomain)) {
      errors.push(`Reserved subdomain: ${domain.subdomain}`);
    }

    for (const records of Object.values(domain.records)) {
      if (!records) continue;
      const list = Array.isArray(records) ? records : [records];
      for (const record of list) {
        if (!record.value) {
          errors.push(`${domain.subdomain}: empty record value`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
```

Note: The `with { type: "json" }` import assertion works with NodeNext resolution in TypeScript 5.9. If it causes issues, fall back to `import * as reservedSubdomains from "../reserved_subdomains.json"`.

- [ ] **Step 2: Run validate tests**

Run: `pnpm --filter @is-pinoy/registry vitest run src/tests/validate.test.ts`
Expected: All validate tests pass.

---

### Task 6: Implement diff

**Files:**
- Create: `packages/registry/src/core/diff.ts`

- [ ] **Step 1: Create `src/core/diff.ts`**

```ts
import {
  type Domain,
  type DNSRecord,
  dnsActionSchema,
  type DNSAction,
  type CloudflareRecord,
} from "@is-pinoy/schemas";

function toFQDN(subdomain: string) {
  return `${subdomain}.${process.env.DOMAIN || "is-pinoy.dev"}`;
}

function toTXTRecordFQDN(provider: string) {
  return `_${provider}.${process.env.DOMAIN || "is-pinoy.dev"}`;
}

function normalizeTXTValue(record: DNSRecord): string {
  if (record.type === "TXT") {
    const value = record.value;
    if (!value.startsWith('"') || !value.endsWith('"')) {
      return `"${value}"`;
    }
    return value;
  }
  return record.value;
}

function expandDomain(domain: Domain) {
  const baseFqdn = toFQDN(domain.subdomain);
  const result: { fqdn: string; record: DNSRecord }[] = [];

  for (const [type, records] of Object.entries(domain.records)) {
    if (!records) continue;
    const list = Array.isArray(records) ? records : [records];
    for (const record of list) {
      const dnsRecord = { type: type as DNSRecord["type"], ...record } as DNSRecord;
      let fqdn = baseFqdn;
      if (type === "TXT" && "provider" in record) {
        fqdn = toTXTRecordFQDN(record.provider);
      }
      result.push({ fqdn, record: dnsRecord });
    }
  }

  return result;
}

export function diff(
  desired: Domain[],
  actual: CloudflareRecord[],
): DNSAction[] {
  const actions: DNSAction[] = [];

  const activeDomains = desired.filter((d) => !d.destroy);
  const destroyedDomains = desired.filter((d) => d.destroy);

  const desiredFlat = activeDomains.flatMap(expandDomain);

  const destroyedFqdns = new Set(
    destroyedDomains.map((d) => toFQDN(d.subdomain)),
  );

  const destroyedTXTValues = new Set(
    destroyedDomains.flatMap((d) => {
      const result: string[] = [];
      for (const [type, records] of Object.entries(d.records)) {
        if (type !== "TXT" || !records) continue;
        const list = Array.isArray(records) ? records : [records];
        for (const record of list) {
          const value = record.value;
          result.push(
            value.startsWith('"') && value.endsWith('"') ? value : `"${value}"`,
          );
        }
      }
      return result;
    }),
  );

  for (const d of desiredFlat) {
    const match = actual.find(
      (a) => a.name === d.fqdn && a.type === d.record.type,
    );

    if (!match) {
      const action: DNSAction = {
        type: "CREATE",
        fqdn: d.fqdn,
        record: d.record,
      };
      actions.push(dnsActionSchema.parse(action));
      continue;
    }

    if (match.content !== normalizeTXTValue(d.record)) {
      const action: DNSAction = {
        type: "UPDATE",
        id: match.id,
        fqdn: d.fqdn,
        record: d.record,
      };
      actions.push(dnsActionSchema.parse(action));
    }
  }

  for (const a of actual) {
    const isTXTRecordMatch =
      a.type === "TXT" && destroyedTXTValues.has(a.content);

    if (destroyedFqdns.has(a.name) || isTXTRecordMatch) {
      const action: DNSAction = {
        type: "DELETE",
        id: a.id,
        fqdn: a.name,
      };
      actions.push(dnsActionSchema.parse(action));
    }
  }

  return actions;
}
```

- [ ] **Step 2: Run diff tests**

Run: `pnpm --filter @is-pinoy/registry vitest run src/tests/diff.test.ts`
Expected: All diff tests pass.

---

### Task 7: Implement sync

**Files:**
- Create: `packages/registry/src/core/sync.ts`

- [ ] **Step 1: Create `src/core/sync.ts`**

```ts
import { type DNSAction } from "@is-pinoy/schemas";
import {
  createRecord,
  updateRecord,
  deleteRecord,
} from "../providers/cloudflare/client.js";

function logAction(action: DNSAction) {
  switch (action.type) {
    case "CREATE":
      console.log(
        `[DRY RUN] CREATE ${action.fqdn} \u2192 ${action.record.type} \u2192 ${action.record.value}`,
      );
      break;
    case "UPDATE":
      console.log(
        `[DRY RUN] UPDATE ${action.fqdn} (${action.id}) \u2192 ${action.record.type} \u2192 ${action.record.value}`,
      );
      break;
    case "DELETE":
      console.log(`[DRY RUN] DELETE ${action.fqdn} (${action.id})`);
      break;
  }
}

export async function sync(actions: DNSAction[], isDryRun = true) {
  for (const action of actions) {
    if (isDryRun) {
      logAction(action);
      continue;
    }
    switch (action.type) {
      case "CREATE":
        await createRecord(action.record, action.fqdn);
        console.log(`CREATED ${action.fqdn}`);
        break;
      case "UPDATE":
        await updateRecord(action.id, action.record, action.fqdn);
        console.log(`UPDATED ${action.fqdn}`);
        break;
      case "DELETE":
        await deleteRecord(action.id);
        console.log(`DELETED ${action.fqdn}`);
        break;
    }
  }
}
```

- [ ] **Step 2: Run all tests**

Run: `pnpm --filter @is-pinoy/registry vitest run`
Expected: All tests pass.

---

### Task 8: Update library public API

**Files:**
- Modify: `packages/registry/src/index.ts`

- [ ] **Step 1: Update `src/index.ts`**

Already done in Task 1, Step 5. Verify it re-exports everything.

```ts
export * from "./core/loader.js";
export * from "./core/validate.js";
export * from "./core/diff.js";
export * from "./core/sync.js";
export * from "./providers/cloudflare/client.js";
```

- [ ] **Step 2: Final full verification**

Run: `pnpm --filter @is-pinoy/registry vitest run`
Run: `pnpm --filter @is-pinoy/registry typecheck`
Expected: All tests pass. TypeScript typecheck passes.
