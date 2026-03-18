# Inventory Management Workspace Guidelines

## Build and Run
- Frontend (`frontend/`): `npm run dev`, `npm run lint`, `npm run build`, `npm start`.
- Backend (`backend/`): `uvicorn app.main:app --reload` for local dev; Docker uses Gunicorn + Uvicorn worker.
- Full stack: `docker-compose up` (or `docker-compose up --profile local-db` to run local MongoDB service).
- Default local access: frontend `http://localhost:3000`, backend `http://localhost:8000`, full app through Nginx `http://localhost:8888`.

## Architecture Boundaries
- Frontend uses Next.js App Router in `frontend/app/`.
- Backend uses FastAPI in `backend/app/` with modules under `api/`, `core/`, `db/`, `services/`, `schemas/`, and `models/`.
- Database stack is MongoDB + Redis; backend DB clients live in `backend/app/db/`.
- Route protection on frontend is handled by Clerk middleware logic in `frontend/proxy.ts`.

## Frontend UI and Integration Standards
- UI must be production-grade and visually polished, inspired by modern product patterns (e.g., Dribbble-level quality) without copying proprietary layouts/assets verbatim.
- Prefer reusable, accessible UI patterns: responsive spacing, clear hierarchy, loading/error/empty states, and keyboard-accessible interactions.
- Any component/section that depends on backend data must explicitly implement all three UI states: loading, error, and empty.
- Use skeleton loaders (not spinners-only) for loading states in data-driven components and pages.
- For all new forms, use React Hook Form + schema validation (Zod preferred).
- For all server state, use TanStack Query (`useQuery`, `useMutation`, invalidation, optimistic updates only when safe).
- Keep API interactions typed end-to-end; avoid `any` in request/response contracts.

## MongoDB-First Data Contract Conventions
- Assume backend persistence targets MongoDB documents.
- Define explicit TypeScript DTO/contracts for payloads and responses.
- Always include stable identifiers and timestamps in contracts when relevant (`id`, `createdAt`, `updatedAt`).
- Normalize nullable and optional fields deliberately; do not rely on implicit undefined behavior.
- For demo/sample/mock data, always use strict TypeScript types from the same DTO/contracts (no untyped literals or `any`) so mock data shape remains backend-ready.
- Keep sample data field names, nesting, and value formats aligned with the intended backend schema to minimize future integration changes.

## TypeScript File Organization (Required for New Frontend Features)
- Place production-grade TypeScript integrations in dedicated folders:
  - `frontend/lib/contracts/` for shared DTO/request/response types.
  - `frontend/lib/api/` for HTTP client modules and endpoint functions.
  - `frontend/lib/queries/` for TanStack Query keys/hooks.
  - `frontend/lib/forms/` for form schemas, defaults, and mappers.
  - `frontend/lib/mappers/` for UI-model ↔ API-model transforms.
- For any new backend-integrated section/component, create and maintain the related TypeScript files in these folders (contracts, API client functions, query hooks, and mappers as needed) instead of embedding data logic inline in UI components.
- Keep page components thin: orchestration + composition only. Move business/data logic into the folders above.

## Backend Alignment for Future Integration
- Keep naming and field semantics consistent with backend `schemas/` and future API contracts.
- Prefer explicit mapper functions between frontend view models and backend payloads.
- Ensure frontend assumptions match backend environment/config constraints (Mongo URI, auth, Cloudinary, Redis).

## Known Pitfalls
- Clerk auth can loop if system time is skewed; verify OS time sync when auth redirects behave unexpectedly.
- Avoid invalid redirect targets (e.g., routes not present in `frontend/app/`).
- In containerized runs, backend Redis host should use Docker network hostname (`redis`), not localhost.

## Implementation Behavior for Agents
- Prefer minimal, focused edits and preserve existing UI/architecture style.
- Run targeted validation after changes (`npm run lint`, then `npm run build` for frontend-affecting work).
- Do not introduce new frameworks unless explicitly requested.
