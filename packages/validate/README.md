# @is-pinoy-dev/validate

Validate [is-pinoy.dev](https://is-pinoy.dev) subdomain files before submitting a PR.

## Installation

```bash
npm install @is-pinoy-dev/validate
```

## Usage

```ts
import { validateDomain } from "@is-pinoy-dev/validate";
import { readFileSync } from "fs";

const json = JSON.parse(readFileSync("bosque.json", "utf-8"));
const result = validateDomain(json);

if (!result.ok) {
  console.error("Validation failed:");
  result.errors.forEach((e) => console.error(" -", e));
} else {
  console.log("Valid!");
}
```

## API

### `validateDomain(json: unknown): { ok: boolean; errors: string[] }`

Validates a single domain file object. Accepts any input — returns `ok: false` with a list of error messages if invalid.

**Checks performed:**
- Schema validation (required fields, correct types, valid record values)
- Reserved subdomain names
- Subdomain format (`a-z`, `0-9`, `-` only, max 63 characters)

## Subdomain File Format

```json
{
  "subdomain": "your-name",
  "owner": {
    "github": "your-github-username",
    "email": "you@example.com"
  },
  "records": {
    "CNAME": {
      "value": "your-deployment-url"
    }
  }
}
```

Supported record types: `A`, `CNAME`, `TXT`.
