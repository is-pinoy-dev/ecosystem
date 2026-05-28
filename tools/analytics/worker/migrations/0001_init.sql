CREATE TABLE IF NOT EXISTS visits_daily (
  subdomain TEXT    NOT NULL,
  date      TEXT    NOT NULL,
  visits    INTEGER NOT NULL,
  PRIMARY KEY (subdomain, date)
);

CREATE TABLE IF NOT EXISTS visits_daily_by_country (
  subdomain TEXT    NOT NULL,
  date      TEXT    NOT NULL,
  country   TEXT    NOT NULL,
  visits    INTEGER NOT NULL,
  PRIMARY KEY (subdomain, date, country)
);
