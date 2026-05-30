CREATE TABLE IF NOT EXISTS subdomain_status (
  subdomain    TEXT NOT NULL PRIMARY KEY,
  dns_status   TEXT NOT NULL,
  http_status  TEXT NOT NULL,
  overall      TEXT NOT NULL,
  since        TEXT NOT NULL,
  last_checked TEXT NOT NULL
);
