# Preca · Controle de Precatórios

Sistema para gestão de precatórios: cadastro, fluxo de estágios, cotação multi-comprador, negociação e dashboard.

## Stack

- **Monorepo**: Turborepo + pnpm workspaces
- **Backend**: NestJS 10 · Prisma 6 · PostgreSQL 16 · JWT · Zod (via nestjs-zod) · Swagger
- **Frontend**: React 18 · Vite 6 · TailwindCSS 3 · Shadcn · Tanstack Query · React Hook Form · Zod · Zustand · Nuqs · Lucide
- **Qualidade**: Biome (lint+format) · Husky · commitlint (conventional commits) · conventional-changelog
- **Testes**: Jest (api) · Vitest (web) · Playwright (E2E) · Storybook (design system)
- **Infra**: Docker · Cloudflare R2 (storage) · Neon (Postgres) · Fly.io (api) · Cloudflare Pages (web) · Sentry

## Estrutura

```
projeto-preca/
├── apps/
│   ├── api/                  NestJS + Prisma
│   └── web/                  React + Vite
├── packages/
│   └── shared/               Schemas Zod + enums (single source of truth)
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
pnpm dev                    # roda api + web em paralelo (Turborepo)
pnpm build                  # build de todos os packages
pnpm lint                   # Biome em todos os pacotes
pnpm format                 # Biome format --write
pnpm check                  # Biome check --write (corrige automaticamente)
pnpm test                   # roda testes (Jest na api, Vitest no web)

# Prisma
pnpm --filter @preca/api prisma:migrate          # criar e aplicar migration em dev
pnpm --filter @preca/api prisma:migrate:deploy   # aplicar migrations em prod
pnpm --filter @preca/api prisma:studio           # GUI do Prisma
pnpm --filter @preca/api prisma:seed             # rodar seed

# Web
pnpm --filter @preca/web storybook               # design system
pnpm --filter @preca/web e2e                     # Playwright
```

## Adicionar componentes Shadcn

```bash
cd apps/web
pnpm dlx shadcn@latest add button input label dialog
```

## Convenções de código

- **Pastas e arquivos**: kebab-case (`teste-teste.ts`)
- **Componentes React**: PascalCase (`ComponenteTeste`)
- **Hooks**: camelCase (`useDeTeste`)
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, ...)
- **Schemas Zod**: criados em `packages/shared/src/schemas` e reusados nos dois lados (RHF no web, nestjs-zod no api)
- **Estado**: Context apenas para tema/sessão/i18n; Zustand para qualquer estado runtime compartilhado

## Modelo de domínio

Detalhes no [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma). Resumo:

- `Precatorio` — entidade central; estágio bidirecional; tags derivadas (Score), tipo manual
- `Cedente` (obrigatório), `Parceiro` (opcional, 1 por precatório), `Comprador` (lista de bancos/fundos)
- `Cotacao` — uma por (precatório, comprador); status PENDENTE → RECEBIDA/RECUSADA
- `Negociacao` — thread de propostas/contrapropostas
- `Anexo` — PDFs no Cloudflare R2; OCR opcional (Fase 4)
- `HistoricoEstagio`, `AuditLog`, `Notificacao` — observabilidade

## Roadmap

| Fase | Escopo |
|------|--------|
| 0 | Setup do monorepo · Prisma schema · scaffolding (✅ feito) |
| 1 | Auth funcional · CRUDs base (Cedentes, Parceiros, Compradores) · layout |
| 2 | CRUD Precatórios · upload R2 · fluxo bidirecional · filtros Nuqs · audit log |
| 3 | Cotações multi-comprador · negociação · campos de comissão pós-cotação |
| 4 | OCR (pdf-parse + Tesseract fallback) · parsers Federal/SP/RJ · comparação |
| 5 | Dashboard · notificações in-app · SLA de precatório parado |
| 6 | Playwright E2E · Storybook · deploy Fly.io + Cloudflare Pages · Sentry |

## Deploy (resumo)

- **API**: Fly.io (Dockerfile incluso) com Postgres no Neon e R2 para anexos
- **Web**: Cloudflare Pages (build `pnpm --filter @preca/web build`, output `apps/web/dist`)
- **Migrations**: `prisma migrate deploy` em release step (CI)
- **CI**: GitHub Actions roda lint + type-check + tests + migrations em PR/main
