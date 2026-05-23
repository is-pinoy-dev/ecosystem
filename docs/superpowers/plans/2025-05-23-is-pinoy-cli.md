# is-pinoy CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a `packages/cli/` package with an `is-pinoy` binary that wraps `@is-pinoy/registry` functionality into CLI subcommands.

**Architecture:** Thin commander-based CLI layer over `@is-pinoy/registry`. Commands that need Cloudflare (diff/sync/status) use dynamic `import()` after setting env vars, because the registry's cloudflare client reads creds at module level. The validate command uses a subpath static import (avoids loading cloudflare).

**Tech Stack:** Node.js, TypeScript, commander, picocolors, @is-pinoy/registry, @is-pinoy/schemas

---

### Task 1: Scaffold packages/cli/

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/eslint.config.js`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@is-pinoy/cli",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "bin": {
    "is-pinoy": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "lint": "eslint",
    "format": "prettier --write \"**/*.{ts,tsx}\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@is-pinoy/registry": "workspace:*",
    "commander": "^13.1.0",
    "picocolors": "^1.1.1"
  },
  "devDependencies": {
    "@types/node": "^22.15.3",
    "@workspace/eslint-config": "workspace:*",
    "@workspace/typescript-config": "workspace:*",
    "eslint": "^9.39.2",
    "typescript": "^5.9.3"
  },
  "exports": {
    ".": "./src/index.ts"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "@workspace/typescript-config/base.json",
  "compilerOptions": {
    "outDir": "./dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create eslint.config.js**

```js
import { config } from "@workspace/eslint-config/base"

/** @type {import("eslint").Linter.Config} */
export default config
```

- [ ] **Step 4: Install dependencies**

Run: `pnpm install`
Expected: Dependencies resolved, lockfile updated.

- [ ] **Step 5: Build to verify scaffolding works**

Run: `pnpm --filter @is-pinoy/cli build`
Expected: `packages/cli/dist/` created with compiled JS.

- [ ] **Step 6: Commit**

```bash
git add packages/cli/
git commit -m "feat(cli): scaffold packages/cli package"
```

---

### Task 2: Create utility modules

**Files:**
- Create: `packages/cli/src/utils/cloudflare.ts`
- Create: `packages/cli/src/utils/output.ts`

- [ ] **Step 1: Create src/utils/cloudflare.ts**

```ts
export interface CloudflareCreds {
  apiToken: string;
  zoneId: string;
}

export function resolveCloudflareCreds(options: {
  apiKey?: string;
  zoneId?: string;
}): CloudflareCreds {
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
```

- [ ] **Step 2: Create src/utils/output.ts**

```ts
import pc from "picocolors";

export function success(message: string): void {
  console.log(pc.green(`✔ ${message}`));
}

export function error(message: string): void {
  console.error(pc.red(`✖ ${message}`));
}

export function warning(message: string): void {
  console.log(pc.yellow(`⚠ ${message}`));
}

export function info(message: string): void {
  console.log(pc.cyan(`ℹ ${message}`));
}

export function divider(): void {
  console.log(pc.dim("─".repeat(50)));
}

export interface ActionRow {
  type: string;
  fqdn: string;
  details?: string;
}

export function printActionTable(actions: ActionRow[]): void {
  for (const action of actions) {
    const icon =
      action.type === "CREATE"
        ? pc.green("+")
        : action.type === "UPDATE"
          ? pc.yellow("~")
          : pc.red("-");
    console.log(
      `  ${icon} ${action.type.padEnd(6)} ${action.fqdn}${action.details ? ` → ${action.details}` : ""}`,
    );
  }
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @is-pinoy/cli typecheck`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/utils/
git commit -m "feat(cli): add cloudflare credential resolver and output utils"
```

---

### Task 3: Create registry validate subcommand

The registry's `validateDomains` is in `@is-pinoy/registry/core/validate.js` which does NOT import the cloudflare client. So we can use a static subpath import safely.

**Files:**
- Create: `packages/cli/src/commands/registry/index.ts`
- Create: `packages/cli/src/commands/registry/validate.ts`

- [ ] **Step 1: Create src/commands/registry/validate.ts**

```ts
import { validateDomains } from "@is-pinoy/registry/core/validate.js";
import { success, error } from "../../utils/output.js";

export function handleValidate(dir: string): void {
  const result = validateDomains(dir);

  if (result.ok) {
    success("All domains are valid.");
    process.exit(0);
  }

  for (const err of result.errors) {
    error(err);
  }
  process.exit(1);
}
```

- [ ] **Step 2: Create src/commands/registry/index.ts**

```ts
import { Command } from "commander";
import { handleValidate } from "./validate.js";

export function registerRegistryCommand(program: Command): void {
  const registry = program
    .command("registry")
    .description("Manage DNS registry");

  registry
    .command("validate")
    .description("Validate domain JSON files")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .action((options) => {
      handleValidate(options.dir);
    });
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @is-pinoy/cli typecheck`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/
git commit -m "feat(cli): add registry validate subcommand"
```

---

### Task 4: Create diff subcommand

diff/sync/status need the cloudflare client (via `listRecords`), which reads creds at module level. So we use dynamic `import()` after setting env vars.

**Files:**
- Create: `packages/cli/src/commands/registry/diff.ts`
- Modify: `packages/cli/src/commands/registry/index.ts`

- [ ] **Step 1: Create src/commands/registry/diff.ts**

```ts
import {
  resolveCloudflareCreds,
  setCloudflareEnv,
} from "../../utils/cloudflare.js";
import { info, warning, success, divider, printActionTable } from "../../utils/output.js";

export async function handleDiff(
  dir: string,
  credsOptions: { apiKey?: string; zoneId?: string },
): Promise<void> {
  const creds = resolveCloudflareCreds(credsOptions);
  setCloudflareEnv(creds);

  // Dynamic import ensures registry's cloudflare client reads creds AFTER we set env vars
  const registry = await import("@is-pinoy/registry");
  const domains = registry.loadDomains(dir);
  info(`Loaded ${domains.length} domain(s) from ${dir}`);

  // listRecords returns CloudflareRecord[] (single item or array)
  const records = await registry.listRecords();
  const recordsArray = Array.isArray(records) ? records : [records];
  info(`Fetched ${recordsArray.length} DNS record(s) from Cloudflare`);

  const actions = registry.diff(domains, recordsArray);

  if (actions.length === 0) {
    success("No changes needed. All domains are in sync.");
    process.exit(0);
  }

  warning(`${actions.length} change(s) detected:`);
  divider();
  printActionTable(actions);
  divider();
}
```

- [ ] **Step 2: Update src/commands/registry/index.ts**

```ts
import { Command } from "commander";
import { handleValidate } from "./validate.js";
import { handleDiff } from "./diff.js";

export function registerRegistryCommand(program: Command): void {
  const registry = program
    .command("registry")
    .description("Manage DNS registry");

  registry
    .command("validate")
    .description("Validate domain JSON files")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .action((options) => {
      handleValidate(options.dir);
    });

  registry
    .command("diff")
    .description("Show differences between local domains and Cloudflare")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .option("--zone-id <id>", "Cloudflare zone ID (overrides CLOUDFLARE_ZONE_ID env)")
    .option("--api-key <key>", "Cloudflare API token (overrides CLOUDFLARE_API_TOKEN env)")
    .action(async (options) => {
      await handleDiff(options.dir, {
        apiKey: options.apiKey,
        zoneId: options.zoneId,
      });
    });
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @is-pinoy/cli typecheck`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/registry/
git commit -m "feat(cli): add registry diff subcommand"
```

---

### Task 5: Create sync subcommand

**Files:**
- Create: `packages/cli/src/commands/registry/sync.ts`
- Modify: `packages/cli/src/commands/registry/index.ts`

- [ ] **Step 1: Create src/commands/registry/sync.ts**

```ts
import {
  resolveCloudflareCreds,
  setCloudflareEnv,
} from "../../utils/cloudflare.js";
import {
  info,
  warning,
  success,
  divider,
  printActionTable,
} from "../../utils/output.js";

async function confirmAction(count: number): Promise<boolean> {
  return new Promise((resolve) => {
    process.stdout.write(`Apply ${count} change(s) to Cloudflare? (y/N) `);
    process.stdin.once("data", (data) => {
      const input = data.toString().trim().toLowerCase();
      resolve(input === "y" || input === "yes");
    });
  });
}

export async function handleSync(
  dir: string,
  credsOptions: { apiKey?: string; zoneId?: string },
  autoConfirm: boolean,
): Promise<void> {
  const creds = resolveCloudflareCreds(credsOptions);
  setCloudflareEnv(creds);

  const registry = await import("@is-pinoy/registry");
  const domains = registry.loadDomains(dir);
  info(`Loaded ${domains.length} domain(s) from ${dir}`);

  const records = await registry.listRecords();
  const recordsArray = Array.isArray(records) ? records : [records];
  info(`Fetched ${recordsArray.length} DNS record(s) from Cloudflare`);

  const actions = registry.diff(domains, recordsArray);

  if (actions.length === 0) {
    success("No changes needed. All domains are in sync.");
    process.exit(0);
  }

  warning(`${actions.length} change(s) to apply:`);
  divider();
  printActionTable(actions);
  divider();

  if (!autoConfirm) {
    const ok = await confirmAction(actions.length);
    if (!ok) {
      info("Sync cancelled.");
      process.exit(0);
    }
  }

  await registry.sync(actions);
  success("Sync complete.");
}
```

- [ ] **Step 2: Update src/commands/registry/index.ts**

```ts
import { Command } from "commander";
import { handleValidate } from "./validate.js";
import { handleDiff } from "./diff.js";
import { handleSync } from "./sync.js";

export function registerRegistryCommand(program: Command): void {
  const registry = program
    .command("registry")
    .description("Manage DNS registry");

  registry
    .command("validate")
    .description("Validate domain JSON files")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .action((options) => {
      handleValidate(options.dir);
    });

  registry
    .command("diff")
    .description("Show differences between local domains and Cloudflare")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .option("--zone-id <id>", "Cloudflare zone ID (overrides CLOUDFLARE_ZONE_ID env)")
    .option("--api-key <key>", "Cloudflare API token (overrides CLOUDFLARE_API_TOKEN env)")
    .action(async (options) => {
      await handleDiff(options.dir, {
        apiKey: options.apiKey,
        zoneId: options.zoneId,
      });
    });

  registry
    .command("sync")
    .description("Apply domain changes to Cloudflare")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .option("--zone-id <id>", "Cloudflare zone ID (overrides CLOUDFLARE_ZONE_ID env)")
    .option("--api-key <key>", "Cloudflare API token (overrides CLOUDFLARE_API_TOKEN env)")
    .option("-y, --yes", "Skip confirmation prompt")
    .action(async (options) => {
      await handleSync(
        options.dir,
        { apiKey: options.apiKey, zoneId: options.zoneId },
        options.yes,
      );
    });
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @is-pinoy/cli typecheck`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/registry/
git commit -m "feat(cli): add registry sync subcommand"
```

---

### Task 6: Create status subcommand

**Files:**
- Create: `packages/cli/src/commands/registry/status.ts`
- Modify: `packages/cli/src/commands/registry/index.ts`

- [ ] **Step 1: Create src/commands/registry/status.ts**

```ts
import { resolveCloudflareCreds, setCloudflareEnv } from "../../utils/cloudflare.js";
import { info, warning, success, divider } from "../../utils/output.js";
import pc from "picocolors";

export async function handleStatus(
  dir: string,
  credsOptions: { apiKey?: string; zoneId?: string },
): Promise<void> {
  const creds = resolveCloudflareCreds(credsOptions);
  setCloudflareEnv(creds);

  const registry = await import("@is-pinoy/registry");
  const domains = registry.loadDomains(dir);
  const records = await registry.listRecords();
  const recordsArray = Array.isArray(records) ? records : [records];
  const actions = registry.diff(domains, recordsArray);

  divider();
  console.log(`  ${pc.bold("Registry Status")}`);
  divider();
  console.log(`  Domains:     ${pc.cyan(String(domains.length))}`);
  console.log(`  DNS Records: ${pc.cyan(String(recordsArray.length))}`);

  if (actions.length === 0) {
    console.log(`  Sync:        ${pc.green("✔ Synced")}`);
  } else {
    console.log(`  Sync:        ${pc.yellow(`⚠ ${actions.length} pending change(s)`)}`);
  }
  divider();

  for (const domain of domains) {
    const domainActions = actions.filter(
      (a) => a.fqdn.startsWith(domain.subdomain + "."),
    );
    const status =
      domainActions.length === 0
        ? pc.green("✔")
        : pc.yellow(`⚠ ${domainActions.length} pending`);
    console.log(`  ${status} ${domain.subdomain}`);
  }
}
```

- [ ] **Step 2: Update src/commands/registry/index.ts**

```ts
import { Command } from "commander";
import { handleValidate } from "./validate.js";
import { handleDiff } from "./diff.js";
import { handleSync } from "./sync.js";
import { handleStatus } from "./status.js";

export function registerRegistryCommand(program: Command): void {
  const registry = program
    .command("registry")
    .description("Manage DNS registry");

  registry
    .command("validate")
    .description("Validate domain JSON files")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .action((options) => {
      handleValidate(options.dir);
    });

  registry
    .command("diff")
    .description("Show differences between local domains and Cloudflare")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .option("--zone-id <id>", "Cloudflare zone ID (overrides CLOUDFLARE_ZONE_ID env)")
    .option("--api-key <key>", "Cloudflare API token (overrides CLOUDFLARE_API_TOKEN env)")
    .action(async (options) => {
      await handleDiff(options.dir, {
        apiKey: options.apiKey,
        zoneId: options.zoneId,
      });
    });

  registry
    .command("sync")
    .description("Apply domain changes to Cloudflare")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .option("--zone-id <id>", "Cloudflare zone ID (overrides CLOUDFLARE_ZONE_ID env)")
    .option("--api-key <key>", "Cloudflare API token (overrides CLOUDFLARE_API_TOKEN env)")
    .option("-y, --yes", "Skip confirmation prompt")
    .action(async (options) => {
      await handleSync(
        options.dir,
        { apiKey: options.apiKey, zoneId: options.zoneId },
        options.yes,
      );
    });

  registry
    .command("status")
    .description("Show registry status overview")
    .option("-d, --dir <path>", "Domains directory", "./domains")
    .option("--zone-id <id>", "Cloudflare zone ID (overrides CLOUDFLARE_ZONE_ID env)")
    .option("--api-key <key>", "Cloudflare API token (overrides CLOUDFLARE_API_TOKEN env)")
    .action(async (options) => {
      await handleStatus(options.dir, {
        apiKey: options.apiKey,
        zoneId: options.zoneId,
      });
    });
}
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @is-pinoy/cli typecheck`
Expected: No type errors.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/src/commands/registry/
git commit -m "feat(cli): add registry status subcommand"
```

---

### Task 7: Wire up CLI entry point

**Files:**
- Create: `packages/cli/src/index.ts`

- [ ] **Step 1: Create src/index.ts**

```ts
#!/usr/bin/env node

import { program } from "commander";
import { registerRegistryCommand } from "./commands/registry/index.js";

program
  .name("is-pinoy")
  .description("CLI for managing the Philippine domain DNS registry")
  .version("0.0.0");

registerRegistryCommand(program);

program.parse();
```

- [ ] **Step 2: Build**

```bash
pnpm --filter @is-pinoy/cli build
```

- [ ] **Step 3: Verify shebang is preserved**

```bash
head -1 packages/cli/dist/index.js
```

Expected: `#!/usr/bin/env node`

If tsc strips the shebang, we need a build fix. Check `dist/index.js` — if the first line is `"use strict";` or similar, the shebang was stripped. In that case, add a `postbuild` script to `package.json`:

```json
"postbuild": "node -e \"const fs=require('fs');let c=fs.readFileSync('dist/index.js','utf8');if(!c.startsWith('#!')){fs.writeFileSync('dist/index.js','#!/usr/bin/env node\\n'+c)}\""
```

- [ ] **Step 4: Test the CLI locally**

```bash
node packages/cli/dist/index.js --help
```

Expected: Shows help with registry command.

```bash
node packages/cli/dist/index.js registry --help
```

Expected: Shows validate, diff, sync, status.

- [ ] **Step 5: Commit**

```bash
git add packages/cli/src/index.ts
git commit -m "feat(cli): wire up CLI entry point with commander"
```

---

### Task 8: Add tests

**Files:**
- Create: `packages/cli/vitest.config.ts`
- Create: `packages/cli/src/tests/validate.test.ts`

- [ ] **Step 1: Create vitest.config.ts**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 2: Create src/tests/validate.test.ts**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

// We test validate's logic by mocking the registry module
vi.mock("@is-pinoy/registry/core/validate.js", () => ({
  validateDomains: vi.fn(),
}));

import { validateDomains } from "@is-pinoy/registry/core/validate.js";
import { handleValidate } from "../commands/registry/validate.js";

describe("handleValidate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exits 0 when all domains are valid", () => {
    vi.mocked(validateDomains).mockReturnValue({
      ok: true,
      errors: [],
    });

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    handleValidate("./domains");

    expect(validateDomains).toHaveBeenCalledWith("./domains");
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });

  it("exits 1 when validation has errors", () => {
    vi.mocked(validateDomains).mockReturnValue({
      ok: false,
      errors: ["Duplicate subdomain: test", "Reserved subdomain: admin"],
    });

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    handleValidate("./domains");

    expect(validateDomains).toHaveBeenCalledWith("./domains");
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter @is-pinoy/cli test
```

Expected: Tests pass.

- [ ] **Step 4: Commit**

```bash
git add packages/cli/vitest.config.ts packages/cli/src/tests/
git commit -m "feat(cli): add vitest config and validate tests"
```

---

### Task 9: Verify full integration

- [ ] **Step 1: Run turbo typecheck across the entire monorepo**

```bash
pnpm typecheck
```

Expected: All packages pass, including new `@is-pinoy/cli`.

- [ ] **Step 2: Run lint across the entire monorepo**

```bash
pnpm lint
```

Expected: No lint errors.

- [ ] **Step 3: Final commit if any fixes were made**
