# FlexiLearn

An adaptive educational platform that personalizes learning based on learning style and neurodivergent profile. Features a multi-agent AI system, progress tracking, and full accessibility customization.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/flexilearn run dev` — run the frontend (port 22970, served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19, Vite 7, Tailwind CSS 4, shadcn/ui, React Query, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — Drizzle ORM table definitions (source of truth)
- `lib/api-spec/src/openapi.yaml` — OpenAPI contract (source of truth for API shape)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit manually)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit manually)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/flexilearn/src/` — React frontend
  - `pages/` — onboarding, dashboard, learning-path, skills, accessibility
  - `layouts/dashboard-layout.tsx` — 3-column shell (sidebar + main + agent panel)
  - `components/agent-command-center.tsx` — live-polling right-sidebar agent status

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed React Query hooks + Zod validators. Never write API glue by hand.
- **Orval codegen workaround**: `lib/api-spec/package.json` codegen script uses `printf` to overwrite `lib/api-zod/src/index.ts` after Orval runs, avoiding a conflict with the generated barrel export. Do **not** revert this.
- **Null → undefined mapping in routes**: Drizzle returns `null` for nullable columns; Zod schemas expect `undefined` for optional fields. Routes map `null → undefined` before `.parse()`.
- **3-column dashboard layout**: Left nav sidebar (Deep Navy `#1A202C`), centre main workspace (Soft White `#F7FAFC`), right Agent Command Center panel (polls `/api/agents/status` every 3 s).
- **Accessibility settings stored in localStorage**: No server-side persistence for UI preferences — kept client-side for zero-latency toggle response.

## Product

- **Multi-step onboarding wizard**: captures learning style (Visual/Auditory/Kinesthetic/Reading-Writing) and neurodivergent profile (ADHD, Dyslexia, Autism, Anxiety, Standard, Combined), redirected to if no profile exists.
- **Dashboard**: stats row (lessons, streak, weekly goal, skills), active paths with progress bars, featured lesson, recent activity feed.
- **My Learning Path**: expandable path cards with per-lesson completion state, difficulty badges, and time estimates.
- **Skills Mastery**: skills grouped by category, mastery progress bars with level colour-coding (novice → expert).
- **Accessibility Settings**: font size + line spacing sliders, colour theme selector, cognitive/sensory toggles (focus mode, break reminders, dyslexic font, reduce motion, high contrast) — persisted to localStorage.
- **Agent Command Center**: live status panel for 4 AI agents (Profiling, Planning, NeuroAdapt, Observation) — auto-polls every 3 s, shows progress bars and current task descriptions.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do not run `pnpm dev` at workspace root — use `restart_workflow` instead.
- After schema changes, always run `pnpm --filter @workspace/db run push` then `pnpm --filter @workspace/api-spec run codegen`.
- The Orval codegen `printf` fix in `lib/api-spec/package.json` must not be reverted.
- Agent status route must map `null → undefined` for `progressPercent` and `currentTask` before Zod parsing.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
