---
"@is-pinoy-dev/cli": patch
"@is-pinoy-dev/schemas": patch
---

Fix duplicate record error (81058) and improve DNS sync efficiency

- Fix error 81058 "An identical record already exists" caused by the diff algorithm matching actual records by fqdn+type only, which produced spurious UPDATE/CREATE actions when a domain had multiple records of the same type
- Fix silent record truncation on zones with more than 100 records by requesting per_page=5000 from the Cloudflare API
- Parallelize sync execution with Promise.allSettled so all CREATE/UPDATE/DELETE actions fire concurrently instead of sequentially; a single failure no longer blocks the rest
- Replace O(n×m) find() loops in diff with O(n+m) Map-based lookups
- Detect proxied and TTL changes on records whose content is unchanged and generate UPDATE actions for them
- Add optional proxied and ttl fields to CloudflareRecord schema to support the above comparison
