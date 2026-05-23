# Public Validate Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract domain validation into a standalone `@is-pinoy-dev/validate` package published publicly to npm, while keeping diff/sync/cloudflare in `@is-pinoy-dev/registry` on GitHub Packages (maintainers only).

**Architecture:** Create a new `packages/validate` workspace package containing `validateDomain(json)` — a pure, filesystem-free function that runs the Zod schema parse, reserved subdomain check, and empty value check. Publish `schemas` and `validate` to npm; publish `registry` to GitHub Packages. Update `registry`'s `validateDomains` to delegate to `validateDomain` internally.

**Tech Stack:** TypeScript, Zod 4, Vitest, pnpm workspaces, Changesets

---

## File Map

**Create:**
- `packages/validate/package.json`
- `packages/validate/tsconfig.json`
- `packages/validate/src/index.ts`
- `packages/validate/src/validate.ts`
- `packages/validate/src/reserved_subdomains.json` (copy from registry)
- `packages/validate/src/tests/validate.test.ts`

**Modify:**
- `packages/schemas/package.json` — remove `"private": true`, add `publishConfig`
- `packages/registry/package.json` — add `publishConfig` for GitHub Packages, add `@is-pinoy-dev/validate` dep
- `packages/registry/src/core/validate.ts` — delegate per-domain checks to `validateDomain`
- `packages/registry/src/tests/validate.test.ts` — keep existing tests, they still cover `validateDomains`

---

## Task 1: Create the `validate` package scaffold

**Files:**
- Create: `packages/validate/package.json`
- Create: `packages/validate/tsconfig.json`

- [ ] **Step 1: Create `packages/validate/package.json`**

```json
{
  "name": "@is-pinoy-dev/validate",
  "version": "0.0.0",
  "type": "module",
  "private": false,
  "publishConfig": {
    "registry": "https://registry.npmjs.org",
    "access": "public"
  },
  "scripts": {
    "build": "tsc",
    "lint": "eslint",
    "format": "prettier --write \"**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@is-pinoy-dev/schemas": "workspace:*",
    "zod": "catalog:"
  },
  "devDependencies": {
    "@workspace/eslint-config": "workspace:*",
    "@workspace/typescript-config": "workspace:*",
    "eslint": "^9.39.2",
    "typescript": "^5.9.3",
    "vitest": "^3.1.3"
  },
  "exports": {
    ".": "./dist/index.js"
  }
}
```

- [ ] **Step 2: Create `packages/validate/tsconfig.json`**

```json
{
  "extends": "@workspace/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "types": []
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Install workspace deps**

```bash
cd ecosystem && pnpm install
```

Expected: no errors, `packages/validate` appears in workspace.

- [ ] **Step 4: Commit**

```bash
git add packages/validate/package.json packages/validate/tsconfig.json
git commit -m "feat: scaffold @is-pinoy-dev/validate package"
```

---

## Task 2: Copy reserved subdomains and write the failing test

**Files:**
- Create: `packages/validate/src/reserved_subdomains.json`
- Create: `packages/validate/src/tests/validate.test.ts`

- [ ] **Step 1: Copy reserved subdomains**

Copy `packages/registry/src/reserved_subdomains.json` to `packages/validate/src/reserved_subdomains.json` — same file, same content.

- [ ] **Step 2: Create test file**

Create `packages/validate/src/tests/validate.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { validateDomain } from "../validate.js";

describe("validateDomain", () => {
  it("returns ok for a valid CNAME domain", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: { CNAME: { value: "jun.vercel.app" } },
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns errors for invalid schema (missing owner)", () => {
    const result = validateDomain({
      subdomain: "jun",
      records: { CNAME: { value: "jun.vercel.app" } },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns error for reserved subdomain", () => {
    const result = validateDomain({
      subdomain: "www",
      owner: { github: "hacker" },
      records: { CNAME: { value: "evil.vercel.app" } },
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Reserved subdomain: www");
  });

  it("returns error for empty record value", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: { CNAME: { value: "" } },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns error for subdomain with invalid characters", () => {
    const result = validateDomain({
      subdomain: "Jun_Bad",
      owner: { github: "bosquejun" },
      records: { CNAME: { value: "jun.vercel.app" } },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("returns ok for a valid TXT domain", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: { TXT: { value: "vercel-challenge-abc123", provider: "vercel" } },
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns ok for a valid A record domain", () => {
    const result = validateDomain({
      subdomain: "jun",
      owner: { github: "bosquejun" },
      records: { A: { value: "76.76.21.21" } },
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
cd ecosystem && pnpm --filter @is-pinoy-dev/validate test
```

Expected: FAIL — `Cannot find module '../validate.js'`

- [ ] **Step 4: Commit**

```bash
git add packages/validate/src/reserved_subdomains.json packages/validate/src/tests/validate.test.ts
git commit -m "test: add validateDomain tests (failing)"
```

---

## Task 3: Implement `validateDomain`

**Files:**
- Create: `packages/validate/src/validate.ts`
- Create: `packages/validate/src/index.ts`

- [ ] **Step 1: Create `packages/validate/src/validate.ts`**

```ts
import { domainSchema } from "@is-pinoy-dev/schemas";
import reservedSubdomains from "../reserved_subdomains.json" with { type: "json" };

export function validateDomain(json: unknown): { ok: boolean; errors: string[] } {
  const parsed = domainSchema.safeParse(json);

  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    });
    return { ok: false, errors };
  }

  const domain = parsed.data;
  const errors: string[] = [];

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

  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 2: Create `packages/validate/src/index.ts`**

```ts
export * from "./validate.js";
```

- [ ] **Step 3: Run tests to confirm they pass**

```bash
cd ecosystem && pnpm --filter @is-pinoy-dev/validate test
```

Expected: all 7 tests PASS

- [ ] **Step 4: Commit**

```bash
git add packages/validate/src/validate.ts packages/validate/src/index.ts
git commit -m "feat: implement validateDomain"
```

---

## Task 4: Update `registry` to use `validateDomain`

**Files:**
- Modify: `packages/registry/package.json`
- Modify: `packages/registry/src/core/validate.ts`

- [ ] **Step 1: Add `@is-pinoy-dev/validate` dependency to registry**

In `packages/registry/package.json`, add to `dependencies`:

```json
"@is-pinoy-dev/validate": "workspace:*"
```

- [ ] **Step 2: Run install**

```bash
cd ecosystem && pnpm install
```

Expected: no errors.

- [ ] **Step 3: Update `packages/registry/src/core/validate.ts`**

Replace the entire file:

```ts
import { validateDomain } from "@is-pinoy-dev/validate";
import { loadDomains } from "./loader.js";

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

    const result = validateDomain(domain);
    errors.push(...result.errors);
  }

  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run registry tests to confirm nothing broke**

```bash
cd ecosystem && pnpm --filter @is-pinoy-dev/registry test
```

Expected: all existing tests PASS

- [ ] **Step 5: Commit**

```bash
git add packages/registry/package.json packages/registry/src/core/validate.ts
git commit -m "feat: registry validateDomains delegates to validateDomain"
```

---

## Task 5: Configure publish targets

**Files:**
- Modify: `packages/schemas/package.json`
- Modify: `packages/registry/package.json`

- [ ] **Step 1: Update `packages/schemas/package.json`**

Remove `"private": true` and add `publishConfig`:

```json
{
  "name": "@is-pinoy-dev/schemas",
  "version": "0.0.0",
  "type": "module",
  "publishConfig": {
    "registry": "https://registry.npmjs.org",
    "access": "public"
  },
  ...
}
```

- [ ] **Step 2: Update `packages/registry/package.json`**

Remove `"private": true` and add `publishConfig` for GitHub Packages:

```json
{
  "name": "@is-pinoy-dev/registry",
  "version": "0.0.0",
  "type": "module",
  "publishConfig": {
    "registry": "https://npm.pkg.github.com",
    "access": "restricted"
  },
  ...
}
```

- [ ] **Step 3: Run full workspace typecheck**

```bash
cd ecosystem && pnpm typecheck
```

Expected: no type errors across all packages.

- [ ] **Step 4: Run full workspace tests**

```bash
cd ecosystem && pnpm test
```

Expected: all tests pass across `validate` and `registry`.

- [ ] **Step 5: Commit**

```bash
git add packages/schemas/package.json packages/registry/package.json
git commit -m "chore: configure publishConfig for npm and GitHub Packages"
```
