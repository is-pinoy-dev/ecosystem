---
"@is-pinoy-dev/cli": patch
"@is-pinoy-dev/validate": patch
---

Security hardening: symlink protection, error sanitization, and credential safety

- Reject symlinks in the domains directory loader and validate CLI before reading files, preventing symlink-based access to files outside the intended directory
- Add a 64 KB file size cap before JSON.parse in both the loader and validate CLI to prevent memory exhaustion from oversized inputs
- Sanitize Cloudflare API error messages so only the human-readable message is surfaced instead of the full raw API response
- Warn when --api-key CLI flag is used since the token value is visible to all users via process listings (ps aux)
- Add HTTP security headers to the web app (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy)
- Write ~/.npmrc with chmod 600 in CI to restrict token file permissions to the current user only
