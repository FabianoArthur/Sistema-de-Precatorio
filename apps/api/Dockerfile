### Stage 1: Build ###
FROM node:22-alpine AS builder

RUN apk add --no-cache openssl libc6-compat
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/tsconfig.json packages/shared/
COPY apps/api/package.json apps/api/tsconfig.json apps/api/nest-cli.json apps/api/

RUN pnpm install --frozen-lockfile --filter @preca/api... --filter @preca/shared

COPY packages/shared packages/shared
COPY apps/api apps/api

RUN pnpm --filter @preca/shared build
RUN pnpm --filter @preca/api prisma:generate
RUN pnpm --filter @preca/api build


### Stage 2: Runtime ###
FROM node:22-alpine AS runtime

RUN apk add --no-cache openssl libc6-compat tini \
    && corepack enable \
    && corepack prepare pnpm@10.0.0 --activate

ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /repo/pnpm-workspace.yaml /repo/pnpm-lock.yaml /repo/package.json ./
COPY --from=builder /repo/packages/shared/package.json packages/shared/
COPY --from=builder /repo/packages/shared/dist packages/shared/dist
COPY --from=builder /repo/apps/api/package.json apps/api/
COPY --from=builder /repo/apps/api/dist apps/api/dist
COPY --from=builder /repo/apps/api/prisma apps/api/prisma

RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter @preca/api... --filter @preca/shared \
    && pnpm --filter @preca/api prisma:generate

RUN mkdir -p apps/api/uploads

EXPOSE 3001
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "cd apps/api && pnpm prisma migrate deploy && node dist/main.js"]
