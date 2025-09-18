# Repository Guidelines

## Project Structure & Module Organization
This Turbo monorepo separates UI, shared libraries, and services. `apps/web` hosts the Next.js dashboard under `app/` routes, reusable UI in `components/`, and i18n assets in `public/locales/`. The unified Node gateway lives in `services/platform-gateway` and fronts claims, tenants, analytics, and NPHIES stubs. The ML-powered FastAPI engine lives in `services/claims-ai-engine/src`, with shared compliance helpers under `services/claims-ai-engine/src/brainsait`. Shared front-end building blocks belong to `packages/ui-components/src`. Infrastructure helpers and reusable scripts live under `config/`, `infrastructure/`, and `scripts/`.

## Build, Test, and Development Commands
- `pnpm install` — install all workspace dependencies; always use pnpm 8+ (rerun after dependency changes in `apps/web/package.json`).
- `pnpm dev --filter @nphies-pro/web` — start the dashboard at `http://localhost:3000`.
- `pnpm dev:platform-gateway` / `pnpm dev:claims-ai` — run Node API watch mode and Python engine locally.
- `pnpm build` and `pnpm test` — run Turbo build/test across every workspace.
- `pnpm --filter @nphies-pro/platform-gateway prisma:migrate` — apply Prisma migrations (uses SQLite dev.db by default).
- `pnpm --filter @nphies-pro/platform-gateway prisma:seed` — load demo tenants/claims for local development.
- `pnpm --filter @nphies-pro/web test:e2e` — run Playwright smoke tests (requires web + gateway running locally).
- `curl http://localhost:3001/metrics` / `curl http://localhost:8000/metrics` — scrape Prometheus metrics for gateway and AI engine.
- `POST /api/auth/mock-role` with `{ "role": "claim_adjuster" }` — change mock scopes for local RBAC testing (or use the role switcher overlay).
- `poetry run uvicorn src.main:app --reload` inside `services/claims-ai-engine` — fast reload for the AI service.
- `docker-compose up -d` — bring up the full stack using the default compose file.

## Coding Style & Naming Conventions
- TypeScript/JS: 2-space indentation, follow Next.js + ESLint rules via `pnpm lint`; prefer PascalCase for components and camelCase for hooks/utilities. Consume text through i18next (`apps/web/lib/i18n.ts`) so Arabic/English strings stay centralized in `public/locales/`.
- Tailwind classes should group layout → spacing → color for readability.
- Shared packages export React components from index barrels; keep filenames in kebab-case.
- Python: 4-space indentation, format with `black`, lint with `flake8`, enforce types with `mypy`. Use shared compliance helpers from `brainsait.*` rather than reimplementing RBAC or HIPAA logic.

## Testing Guidelines
- Place web tests in `apps/web/__tests__` or alongside components as `*.test.tsx`; run with `pnpm test --filter @nphies-pro/web`.
- Back-end Jest specs belong in `services/*/src/**/*.spec.ts`; run via `pnpm --filter @nphies-pro/platform-gateway test`.
- Python tests live in `services/claims-ai-engine/tests/test_*.py`; execute `poetry run pytest`.
- Add integration coverage for critical flows (auth, claims adjudication) before merging.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`) as seen in `git log`.
- Scope commits narrowly, include relevant workspace tag (e.g., `feat(web): ...`) when helpful.
- PRs must describe intent, list test evidence, and reference tracking tickets; include screenshots or curl samples for UI/API changes.
- Request review from an owning team and ensure CI (lint, test, type-check) passes before assigning.

## Configuration & Security Notes
Store environment files outside the repo; mount them via deployment pipelines. Update `config/nphies/nphies-config.yaml` and `config/security/*` in lockstep with infrastructure changes, and rotate secrets when deploying new tunnels or services.
