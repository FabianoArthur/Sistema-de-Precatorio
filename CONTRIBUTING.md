# Contributing

Thanks for taking the time. The short version:

1. **Set up** the project as described in the [README](README.md#running-locally).
2. **Branch** from `main` and keep each pull request about one thing.
3. **Commit** with [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:` …). A `commit-msg` hook
   runs commitlint for you.
4. **Check** before you push:

   ```bash
   pnpm lint          # Biome
   pnpm turbo run type-check
   pnpm test          # Jest (api) + Vitest (web, shared)
   pnpm --filter @preca/web e2e:demo   # Playwright against the in-browser demo
   ```

   Running Jest on its own (`pnpm --filter @preca/api exec jest`) needs `packages/shared` built
   first (`pnpm --filter @preca/shared build`); `pnpm test` does that for you through Turborepo.

5. **Open the pull request** against `main`. CI runs lint, type-check, build, unit tests,
   the end-to-end suites and a secret scan; it must be green.

## End-to-end tests against the real API

```bash
docker compose up -d
pnpm --filter @preca/api prisma:migrate:deploy && pnpm --filter @preca/api prisma:seed
pnpm --filter @preca/shared build && pnpm --filter @preca/api build
pnpm --filter @preca/api start &          # API on :3001
pnpm --filter @preca/web e2e              # Playwright starts the web dev server itself
```

## Conventions

- Files and folders in `kebab-case`; React components in `PascalCase`.
- Validation schemas live in `packages/shared` and are reused by the API and the web app.
- Services that change data write the change and its audit-log entry in the **same**
  Prisma transaction.
- The domain vocabulary is Brazilian Portuguese (`precatorio`, `cedente`, `cotacao`); keep it
  that way in code so names match the business language.
- **No real data**, ever — see [SECURITY.md](SECURITY.md#handling-data).
