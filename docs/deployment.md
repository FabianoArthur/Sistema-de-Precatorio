# Deployment

Three pieces: the public demo (static, no backend), and — for real use — the API with its
database and the web app pointed at it.

## Public demo → GitHub Pages

`.github/workflows/pages.yml` builds `apps/web` with `pnpm --filter @preca/web build:demo` and
`VITE_BASE=/<repo>/`, then publishes `apps/web/dist` on every push to `main`.

- One-time setup: **Settings → Pages → Source: GitHub Actions**.
- `build:demo` also copies `index.html` to `404.html`, so opening a deep link such as
  `/<repo>/precatorios` directly still loads the app.
- The demo needs no secrets: data is fictitious and lives in the visitor's browser.

## API → any Docker host (Fly.io config included)

`apps/api/Dockerfile` is a multi-stage build that runs `prisma migrate deploy` on boot.
`apps/api/fly.toml` is ready for Fly.io:

```bash
fly auth login
fly launch --no-deploy --config apps/api/fly.toml          # first time only
fly secrets set --config apps/api/fly.toml \
  DATABASE_URL='postgresql://…?sslmode=require' \
  JWT_SECRET='<long random string>' \
  CORS_ORIGIN='https://<your web host>' \
  SENTRY_DSN='<optional>'
fly volumes create preca_uploads --size 10                 # stores uploaded PDFs
fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile
```

In production the API refuses to start without `CORS_ORIGIN`. See `apps/api/.env.example` for
every variable (SLA days, OCR limits, Sentry sampling).

Uploaded PDFs go to the local filesystem (a persistent volume on Fly). Moving to object storage
means swapping `AnexosService.upload` / `download`.

## Database → PostgreSQL 16

Any managed PostgreSQL works (the project was built against a serverless one). Use a connection
string with `sslmode=require`; migrations run on API boot, or manually with
`pnpm --filter @preca/api prisma:migrate:deploy`.

Seed users only if you override `SEED_USER_1_*` / `SEED_USER_2_*` — the defaults are for local
development.

## Web app → any static host

```bash
VITE_API_URL=https://<your api host> pnpm --filter @preca/web build   # output: apps/web/dist
```

Both files for common hosts are included:

- `apps/web/_redirects` — SPA fallback for Netlify/Cloudflare Pages.
- `apps/web/wrangler.toml` — Cloudflare Workers static assets with SPA fallback
  (`npx wrangler deploy` from `apps/web`).

Optional: `VITE_SENTRY_DSN` and the sampling variables in `apps/web/.env.example`.
