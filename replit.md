# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/content-pipeline run dev` — run the Content Pipeline app (port 3002)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/waterway-wellness` — main storefront web app (Vite + React)
- `artifacts/api-server` — Express API (Stripe checkout, Printify)
- `artifacts/content-pipeline` — standalone content idea tracker (Vite + React, no backend; data in localStorage). Domain model in `src/types.ts`, persistence/migration in `src/lib/storage.ts`, design tokens in `src/index.css` `@theme`.
- `artifacts/mockup-sandbox` — UI prototyping sandbox

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

- **Content Pipeline** (`artifacts/content-pipeline`): one-line-a-day content capture tool. Lines are tagged with a pillar (Golf/Training/Learning/Crew/Ideas) and a hook type (Learned/Funny/Relatable/Story), rated for heat, and moved captured → filmed → posted. Includes capture streak + trailing-7-day stats, "film this next" queue, posted-by-pillar balance with least-fed nudge, search/filter/sort, inline edit, undo, and JSON export/import. All data stays on-device (localStorage, key `pipeline-lines-v2`; migrates the old mockup's `pipeline-lines` key).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
