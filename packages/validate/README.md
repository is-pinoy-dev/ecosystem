# @is-pinoy-dev/validate

Validate your [is-pinoy.dev](https://is-pinoy.dev) subdomain file before submitting a PR.

## Usage

```bash
npx @is-pinoy-dev/validate bosque.json
```

On success:

```
✔ bosque.json is valid
```

On failure:

```
✖ Validation failed for bosque.json:
  - subdomain: String must contain at least 1 character(s)
  - records: At least one record type required
```

## Subdomain File Format

```json
{
  "subdomain": "your-name",
  "owner": {
    "github": "your-github-username",
    "email": "you@example.com"  // optional — for contact purposes only
  },
  "records": {
    "CNAME": {
      "value": "your-deployment-url"
    }
  }
}
```

Supported record types: `A`, `CNAME`, `TXT`.
