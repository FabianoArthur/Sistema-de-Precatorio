# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private reporting instead: **Security → Report a vulnerability** on this
repository. Include what you found, how to reproduce it and what an attacker could do with it.
You should get a first answer within a few days.

## Scope

- The API (`apps/api`): authentication, authorization, file upload, data exposure.
- The web app (`apps/web`), including the public demo build.
- The CI workflows in `.github/workflows`.

The public demo runs entirely in the browser with **fictitious data** and no backend, so there
is nothing server-side to attack there.

## Handling data

This project deals with a domain (court-ordered government debts) where real records carry
personal data. Never commit real documents, names, tax IDs (CPF/CNPJ) or case numbers — not
in code, fixtures, seeds, screenshots or issues. Use made-up values, as the existing tests do.
