---
"@is-pinoy-dev/status": minor
---

Add SSL certificate checking: `checkSsl()` derives validity from HTTPS reachability and reads expiry/issuer from Certificate Transparency logs (crt.sh). Adds `SslStatus`/`SslResult` types and four SSL fields (`ssl_status`, `ssl_expires_at`, `ssl_issuer`, `ssl_checked_at`) to the status interfaces.
