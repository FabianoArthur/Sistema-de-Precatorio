FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

FROM base AS deps
WORKDIR /workspace
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /workspace/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @preca/api prisma generate
RUN pnpm --filter @preca/api build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /workspace/apps/api/dist ./dist
COPY --from=build /workspace/apps/api/node_modules ./node_modules
COPY --from=build /workspace/apps/api/package.json ./package.json
COPY --from=build /workspace/apps/api/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/main.js"]
