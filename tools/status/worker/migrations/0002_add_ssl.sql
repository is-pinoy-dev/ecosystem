ALTER TABLE subdomain_status ADD COLUMN ssl_status TEXT;
ALTER TABLE subdomain_status ADD COLUMN ssl_expires_at TEXT;
ALTER TABLE subdomain_status ADD COLUMN ssl_issuer TEXT;
ALTER TABLE subdomain_status ADD COLUMN ssl_checked_at TEXT;
