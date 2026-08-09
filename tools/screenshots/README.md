# Portfolio screenshot worker

Asynchronous preview generation for the is-pinoy.dev showcase. The Worker
consumes versioned portfolio-ID jobs, resolves the canonical
`https://{subdomain}.is-pinoy.dev/` URL from D1, captures it with Cloudflare
Browser Run, and writes immutable JPEG objects to the existing R2 bucket.

The public web and dashboard apps can call the authenticated read/enqueue
endpoints, but no endpoint or queue payload accepts a URL.

## Cloudflare resources

1. Apply the dashboard D1 migration before deploying this Worker:

   ```bash
   pnpm --filter dashboard db:migrate
   ```

2. Create the queue and dead-letter queue:

   ```bash
   pnpm --filter screenshots exec wrangler queues create portfolio-screenshots
   pnpm --filter screenshots exec wrangler queues create portfolio-screenshots-dlq
   ```

3. In `worker/wrangler.toml`, replace:
   - the all-zero `database_id` with the existing dashboard D1 ID;
   - `replace-with-existing-r2-bucket` with the existing R2 bucket name;
   - `https://replace-with-r2-public-host.invalid` with the bucket's public custom
     domain or approved R2 public base URL.

4. Generate one service secret and set it on the Worker:

   ```bash
   pnpm --filter screenshots exec wrangler secret put SCREENSHOT_WORKER_SECRET
   ```

   Set the exact same value as `SCREENSHOT_WORKER_SECRET` in the Vercel
   environments for both `apps/dashboard` and `apps/web`.

5. Deploy:

   ```bash
   pnpm --filter screenshots deploy
   ```

The Wrangler config creates the Browser Run, D1, R2, queue producer/consumer,
daily cron, and `screenshots-api.is-pinoy.dev` custom-domain bindings. The
deployment token needs Workers Scripts, Browser Run, Queues, D1, and R2 binding
permissions. The Worker secret must be configured separately and is never
stored in git.

## Endpoints

- `POST /v1/jobs` — authenticated, accepts one bounded batch of
  `{ portfolioId, reason }` objects. The Worker creates `requestedAt`.
- `GET /v1/showcase` — authenticated, read-only screenshot metadata for the
  server-rendered showcase.

Both require `Authorization: Bearer $SCREENSHOT_WORKER_SECRET`.

A card without a capture is not a loading state. The showcase ranks previews:
this Worker's screenshot, then `/_tools/og/preview?subdomain=<name>` (the
portfolio's own `og:image`, else a generated OG card — see `tools/og`), then a
branded tile. If the manifest request fails the web app logs it rather than
silently degrading every card.

## Operations

- Capture viewport: 1440×900, device scale factor 1, first viewport only,
  JPEG quality 85.
- Object key: `showcase/{portfolioId}/preview-v{version}.jpeg`.
- Automatic retry delays: 5 minutes, 30 minutes, and 6 hours.
- Daily scheduling selects at most 25 rows, oldest first.
- Ready screenshots older than 30 days are refreshed.
- Manual owner refresh defaults to one request per 24 hours.
- Older R2 versions remain available; cleanup can be added as a separate
  lifecycle policy without affecting the active database key.

Local Browser Run development requires remote mode; `pnpm dev` enables it.
Unit tests mock Browser Run and R2 and never make a live capture.
