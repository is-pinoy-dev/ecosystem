# @is-pinoy-dev/schemas

Zod schemas and TypeScript types for [is-pinoy.dev](https://is-pinoy.dev) subdomain files.

## Installation

```bash
npm install @is-pinoy-dev/schemas
```

## Usage

```ts
import { domainSchema, type Domain } from "@is-pinoy-dev/schemas";

const result = domainSchema.safeParse(json);

if (!result.success) {
  console.error(result.error.issues);
} else {
  const domain: Domain = result.data;
}
```

## Exports

### Schemas

| Export | Description |
|---|---|
| `domainSchema` | Full domain file schema |
| `resolvedDomainSchema` | Domain schema extended with `file` field |
| `ResolvedDomainsSchema` | Array of resolved domains |
| `dnsRecordSchema` | Discriminated union of all DNS record types |

### Types

| Export | Description |
|---|---|
| `Domain` | Inferred type from `domainSchema` |
| `ResolvedDomain` | Domain with resolved `file` field |
| `ResolvedDomains` | Array of `ResolvedDomain` |
| `DNSRecord` | Union of all DNS record types |

### DNS Record Schemas

`aRecordSchema`, `aaaaRecordSchema`, `cnameRecordSchema`, `txtRecordSchema`
