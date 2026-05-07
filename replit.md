# FlexiLearn

An adaptive educational platform that personalizes learning based on learning style and neurodivergent profile. Features a multi-agent AI system with real OpenAI SSE streaming, Zustand global memory, progress tracking, dynamic Skills Mastery, and full accessibility customization.

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
- Frontend: React 19, Vite 7, Tailwind CSS 4, shadcn/ui, React Query, Wouter, Zustand 5, Framer Motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- AI: OpenAI via `@workspace/integrations-openai-ai-server` (SSE streaming)

## Where things live

- `lib/db/src/schema/` — Drizzle ORM table definitions (source of truth)
- `lib/api-spec/src/openapi.yaml` — OpenAPI contract (source of truth for API shape)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit manually)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit manually)
- `artifacts/api-server/src/routes/` — Express route handlers
  - `routes/openai/index.ts` — SSE streaming AI conversation routes
- `artifacts/flexilearn/src/` — React frontend
  - `store/index.ts` — Zustand global store (single source of truth for profile, topicMastery, agents, accessibility)
  - `lib/topic-extractor.ts` — Academic topic keyword extraction from user questions
  - `pages/` — onboarding, dashboard, learning-path, skills, accessibility, workspace, analytics
  - `layouts/dashboard-layout.tsx` — 3-column shell (sidebar + main + agent panel), syncs profile to Zustand
  - `components/agent-command-center.tsx` — 6-agent right-sidebar driven by Zustand store

## Architecture decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed React Query hooks + Zod validators. Never write API glue by hand.
- **Orval codegen workaround**: `lib/api-spec/package.json` codegen script uses `printf` to overwrite `lib/api-zod/src/index.ts` after Orval runs, avoiding a conflict with the generated barrel export. Do **not** revert this.
- **Null → undefined mapping in routes**: Drizzle returns `null` for nullable columns; Zod schemas expect `undefined` for optional fields. Routes map `null → undefined` before `.parse()`.
- **3-column dashboard layout**: Left nav sidebar (Deep Navy `#1A202C`), centre main workspace (Soft White `#F7FAFC`), right Agent Command Center panel.
- **Zustand global store (`flexilearn-store-v2`)**: Persists profile, topicMastery, engagementScore, interactionHistory, accessibility, currentConversationId. Agents are ephemeral (not persisted). All agent states driven from store.
- **Global accessibility CSS**: Applied in App.tsx via `GlobalAccessibilityApplicator` — reads Zustand store and applies CSS custom properties + body class names in real time. No save button needed.
- **Profile synced to store**: `DashboardLayout` fetches the learner profile via API and calls `setProfile` on the Zustand store. All pages read from the store.
- **Dynamic Skills Mastery**: Skills are built entirely from `topicMastery` in the Zustand store — populated by the topic extractor as the user asks questions. No hardcoded content. Standard mode shows only academic topics.
- **SSE streaming AI conversations**: `POST /api/openai/conversations/:id/messages` streams GPT-5.4 responses as server-sent events. Frontend reads the stream in real time and streams content into the UI.
- **6-agent orchestration** (Workspace page): Profiling → Planning → Content (AI streaming) → NeuroAdapt → Observation → Reflection. All states written to Zustand store so Agent Command Center reflects live status.

## Product

- **Multi-step onboarding wizard**: captures learning style (Visual/Auditory/Kinesthetic/Reading-Writing) and neurodivergent profile (ADHD, Dyslexia, Autism, Anxiety, Standard, Combined), redirected to if no profile exists.
- **Dashboard**: stats row (lessons, streak, weekly goal, skills), active paths with progress bars, featured lesson, recent activity feed.
- **My Learning Path**: expandable path cards with per-lesson completion state, difficulty badges, and time estimates.
- **Skills Mastery**: dynamic academic topics grouped by subject, mastery progress bars with level colour-coding (novice → expert). Empty state links to Agent Workspace. No hardcoded content.
- **Agent Workspace** (`/workspace`): Full AI chat with SSE streaming, 6-agent orchestration animation, topic tracking, adaptive right panel showing learning context, engagement, and focus areas. Creates/loads a persistent conversation from DB.
- **Progress Analytics** (`/analytics`): Engagement score, topic mastery breakdown, subject groups with average scores, mastered/weak topic lists, recent interaction log.
- **Accessibility Settings**: font size + line spacing sliders, colour theme selector, cognitive/sensory toggles (focus mode, dyslexic font, reduce motion, high contrast) — persisted to Zustand store and applied globally in real time.
- **Agent Command Center**: right sidebar with 6 AI agents (Profiling, Planning, Content, NeuroAdapt, Observation, Reflection) — driven entirely by Zustand store. Shows live progress bars and task descriptions during orchestration.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do not run `pnpm dev` at workspace root — use `restart_workflow` instead.
- After schema changes, always run `pnpm --filter @workspace/db run push` then `pnpm --filter @workspace/api-spec run codegen`.
- The Orval codegen `printf` fix in `lib/api-spec/package.json` must not be reverted.
- Agent status route must map `null → undefined` for `progressPercent` and `currentTask` before Zod parsing.
- Zustand store persist key is `flexilearn-store-v2` — change version if breaking store changes are made.
- `@workspace/db` exports both schema tables (`conversations`, `messages`) and the `db` client directly from its main entry point.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
