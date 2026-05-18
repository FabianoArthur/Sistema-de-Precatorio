# Preca · Controle de Precatórios

Sistema para gestão de precatórios: cadastro, fluxo de estágios, cotação multi-comprador, negociação, anexos com OCR, dashboard e notificações.

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: NestJS 10 · Prisma 6 · PostgreSQL 16 · JWT · Zod + nestjs-zod · Swagger · @nestjs/schedule (cron SLA)
- **Frontend**: React 18 · Vite 6 · TailwindCSS 3 · Shadcn · Tanstack Query · React Hook Form · Zod · Zustand · Nuqs · Lucide · date-fns
- **OCR**: pdf-parse + tesseract.js (fallback) + pdf-img-convert (parsers TRF Federal, TJSP, TJRJ)
- **Qualidade**: Biome (lint+format) · Husky · commitlint · conventional-changelog
- **Testes**: Jest (api) · Vitest (web) · Playwright (E2E)
- **Observabilidade**: Sentry (api + web) · audit log genérico no Postgres
- **Infra**: Docker · Fly.io (api) · Cloudflare Pages (web) · Neon (Postgres) · GitHub Actions

## Estrutura

```
projeto-preca/
├── apps/
│   ├── api/                  NestJS + Prisma + Dockerfile + fly.toml
│   └── web/                  React + Vite + Playwright + wrangler.toml
├── packages/
│   └── shared/               Schemas Zod + enums (single source of truth)
├── .github/workflows/        CI: lint, build, test, E2E, deploy condicional
├── docker-compose.yml        Postgres dev
└── turbo.json
```

## Setup local

### Pré-requisitos

- Node.js 22+
- pnpm 10+ (`corepack enable && corepack prepare pnpm@10 --activate`)
- Docker (para Postgres)

### Passo a passo

```bash
# 1. Instalar deps
pnpm install

# 2. Subir Postgres local
docker compose up -d

# 3. Configurar envs
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 4. Rodar migrations
pnpm --filter @preca/api prisma:migrate

# 5. Seed dos 2 usuários iniciais
pnpm --filter @preca/api prisma:seed

# 6. Rodar tudo
pnpm dev
```

Endpoints:

- API: <http://localhost:3001>
- Swagger: <http://localhost:3001/docs>
- Web: <http://localhost:5173>

### Usuários iniciais (do seed)

- `admin@preca.local` / `admin123`
- `analista@preca.local` / `analista123`

Customize via env (`SEED_USER_1_*` / `SEED_USER_2_*`) antes de rodar o seed em produção.

## Comandos

```bash
pnpm dev                    # api + web em paralelo (Turborepo)
pnpm build                  # build de todos os packages
pnpm lint                   # Biome em todos os pacotes
pnpm format                 # Biome format --write
pnpm check                  # Biome check --write (corrige automaticamente)
pnpm test                   # unit tests (Jest na api, Vitest no web)

# Prisma
pnpm --filter @preca/api prisma:migrate          # criar e aplicar migration em dev
pnpm --filter @preca/api prisma:migrate:deploy   # aplicar migrations em prod
pnpm --filter @preca/api prisma:studio           # GUI do Prisma
pnpm --filter @preca/api prisma:seed             # rodar seed

# E2E
pnpm --filter @preca/web e2e                     # Playwright (web+api precisam estar configurados)
```

### Rodando Playwright localmente

```bash
# Em um terminal: subir api + web
docker compose up -d
pnpm dev

# Em outro: rodar E2E
PLAYWRIGHT_SKIP_WEBSERVER=1 pnpm --filter @preca/web e2e
```

Sem `PLAYWRIGHT_SKIP_WEBSERVER`, o Playwright sobe o web automaticamente — você ainda precisa ter API + Postgres rodando.

## Convenções de código

- **Pastas e arquivos**: kebab-case (`teste-teste.ts`)
- **Componentes React**: PascalCase
- **Hooks**: camelCase
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, ...)
- **Schemas Zod**: criados em `packages/shared/src/schemas` e reusados nos dois lados (RHF no web, nestjs-zod via ZodValidationPipe no api)
- **Audit log**: serviços que mutam estado fazem operação + `tx.auditLog.create()` na mesma `prisma.$transaction`

## Modelo de domínio

Detalhes no [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma). Resumo:

- `Precatorio` — entidade central; estágio bidirecional (11 estágios + FOLLOW_UP); tags derivadas (Score), tipo manual
- `Cedente` (obrigatório, sem aba na sidebar — cadastrado inline via picker), `Parceiro` (opcional, 1 por precatório), `Comprador` (lista de bancos/fundos)
- `Cotacao` — uma por (precatório, comprador); status PENDENTE → RECEBIDA/RECUSADA; ordem por valorBruto desc
- `Negociacao` — thread append+delete entre escritório e cedente
- `Anexo` — PDFs locais em `apps/api/uploads/{precatorioId}/{anexoId}.pdf`; OCR assíncrono via `setImmediate`
- `HistoricoEstagio`, `AuditLog`, `Notificacao` — observabilidade

## Roadmap

| Fase | Escopo | Status |
|------|--------|--------|
| 0 | Setup do monorepo · Prisma schema · scaffolding | ✅ |
| 1 | Auth funcional · CRUDs base (Cedentes, Parceiros, Compradores) · layout | ✅ |
| 2 | CRUD Precatórios · fluxo bidirecional · filtros Nuqs · audit log em transação | ✅ |
| 3 | Cotações multi-comprador · negociação · campos de comissão pós-cotação | ✅ |
| 4 | Anexos · OCR pdf-parse + Tesseract · parsers Federal/SP/RJ · diff automático | ✅ |
| 5 | Dashboard (KPIs + cards estágio + alertas SLA) · notificações in-app + sino · cron SLA | ✅ |
| 6 | Playwright E2E · Sentry · Dockerfile + fly.toml · GitHub Actions CI + deploy | ✅ |

## Deploy

### API → Fly.io

```bash
fly auth login
fly launch --no-deploy --config apps/api/fly.toml      # primeira vez
fly secrets set --config apps/api/fly.toml \
  DATABASE_URL='postgresql://...neon...' \
  JWT_SECRET='...' \
  CORS_ORIGIN='https://preca-web.pages.dev' \
  SENTRY_DSN='https://...sentry.io/...'
fly volumes create preca_uploads --region gru --size 10  # para os PDFs
fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile
```

Em CI, o job `deploy-api` faz isso automaticamente quando `main` recebe push (precisa do secret `FLY_API_TOKEN`).

### Web → Cloudflare Pages

```bash
# Manual via wrangler
pnpm --filter @preca/web build
npx wrangler@latest pages deploy apps/web/dist --project-name=preca-web
```

Secrets necessários para o job `deploy-web`:
- `CLOUDFLARE_API_TOKEN` (Pages:Edit)
- `CLOUDFLARE_ACCOUNT_ID`
- `VITE_API_URL` — URL pública da API
- `VITE_SENTRY_DSN` (opcional)

### Banco → Neon

1. Criar projeto Neon (region us-east ou sa-east).
2. Copiar `DATABASE_URL` com `?sslmode=require`.
3. `pnpm --filter @preca/api prisma migrate deploy` ou deixar o `CMD` do Docker fazer no boot (já configurado).

### Observabilidade

- **Sentry**: backend usa filter global `SentryExceptionFilter` que captura 5xx; frontend usa `Sentry.ErrorBoundary` no root. Sem DSN configurado, ambos viram no-op.
- **Audit log**: tabela `audit_log` (entidade, entidadeId, ação, antes, depois, userId). Sem expiração no MVP.

### Storage de anexos

MVP usa filesystem local com volume persistente em Fly.io (`preca_uploads`). Migrar para Cloudflare R2 quando passar de ~5GB de PDFs — interface já abstraída no `AnexosService.upload` / `download`.
