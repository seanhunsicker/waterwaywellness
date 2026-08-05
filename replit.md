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

- **Content Pipeline** (`artifacts/content-pipeline`): one-line-a-day content capture tool. Lines are tagged with a pillar and a hook style, rated for heat, and moved captured → filmed → posted. Pillars (max 5 — the tint library is capped by colorblind-safe separation on the dark surface), hook styles, and the app heading are all user-editable in Settings (config key `pipeline-config-v1`; defaults: Golf/Training/Learning/Crew/Ideas × Relatable/Valuable/Entertaining). Posted lines take a post URL (platform auto-detected: TikTok/IG/YT/FB/X) and view/like/comment stats logged as append-only snapshots (cap 60/line) so cards show growth since last check; an Insights view has a 7d/30d/all range control, total/avg/engagement-rate tiles, top posts, and average views by pillar, style, and platform. Optional posting-day schedule (config `postDays`, weekday ints) drives a shipped/not-shipped banner on scheduled days only. Several patterns ported from the user's Zingo UGC tracker (seanhunsicker/FrequentHonorableBrains) — snapshots deliberately replace Zingo's max()-ratchet metrics so trends are real. Also: capture streak + trailing-7-day stats, "film this next" queue, posted-by-pillar balance with least-fed nudge, search/filter/sort (new/hot/top), inline edit incl. pillar/style reassignment, undo, JSON export/import (v3 bundles config). Local-first (localStorage, key `pipeline-lines-v2`; migrates the old mockup's `pipeline-lines` key) with optional Supabase cloud sync: set `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (point at the Zingo project for a shared login) and run `supabase_pipeline.sql` once; sync is pull-merge on sign-in + debounced push on save into a `pipeline_data` JSONB row (RLS per user). Without env vars the app runs fully local. `vercel.json` in the package deploys it as its own Vercel project (root dir `artifacts/content-pipeline`). Also published as a Claude artifact (single-file, local-only — its CSP blocks external hosts).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
