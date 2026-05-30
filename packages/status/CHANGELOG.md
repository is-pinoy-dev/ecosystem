# @is-pinoy-dev/status

## 0.2.0

### Minor Changes

- 9dab4cf: Add SSL certificate checking: `checkSsl()` derives validity from HTTPS reachability and reads expiry/issuer from Certificate Transparency logs via SSLMate's Cert Spotter API. Adds `SslStatus`/`SslResult` types and four SSL fields (`ssl_status`, `ssl_expires_at`, `ssl_issuer`, `ssl_checked_at`) to the status interfaces.
