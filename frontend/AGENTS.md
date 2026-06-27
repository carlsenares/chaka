# Frontend Agent Instructions

These instructions apply to all code inside `frontend/`.

## Instruction Precedence

The root `AGENTS.md` is the canonical instruction file for the entire repo and
is always superior to this file.

Agents must read and follow the root `AGENTS.md` first. This frontend file is
only a supplemental guide for frontend-specific workflow, documentation, and
configuration notes.

If this file conflicts with the root `AGENTS.md`, follow the root `AGENTS.md`.
Do not change, weaken, override, or reinterpret the root `AGENTS.md` from
frontend work unless the user explicitly asks for that change.

In particular, preserve these root requirements:

- run `./scripts/setup` before project work when starting fresh
- read `BRIEF.md` before building on product scope
- read `DESIGN.md` before writing UI
- keep the stack aligned with Next.js app router, Tailwind, and shadcn/ui
- keep secrets in `.env` and document required keys in `.env.example`
- follow the branch/PR workflow and avoid pushing straight to `main`
- treat server deployment docs as authoritative for live demos

## Purpose

This frontend is the Next.js decision-support prototype for Chaka Priority Atlas.
It is a hackathon demo for prioritizing natural restoration areas in Ethiopia using
mock data today and backend agent outputs later.

Keep the interface credible for NGO, government, and impact-investor users:

- use calm, light, professional conservation styling
- avoid dark AI-dashboard aesthetics, neon effects, and decorative complexity
- keep copy plain and decision-support oriented
- clearly label mock/prototype data when values are not live outputs

## Run Context

For local frontend development, run frontend commands from this folder:

```bash
cd frontend
npm run dev
npm run build
```

Do not manually edit `next-env.d.ts`; Next.js owns that generated file.

For live demo and deployment instructions, defer to the root `AGENTS.md`,
`DEPLOY.md`, and the repo deployment scripts.

## Documentation Requirement

Whenever a code change affects anything an end user, teammate, demo operator, or
future backend agent integrator can configure or set up, update `frontend/README.md`
in the same change.

Examples that require a README update:

- changing default slider weights
- adding, removing, or renaming slider objectives
- changing backend payload field names
- changing mock data file locations or shapes
- changing map data files, boundary identifiers, or recommendation join logic
- changing run/build commands
- adding environment variables or API keys
- adding a new user-visible configuration option
- moving components, data files, or setup steps documented in the README

Examples that usually do not require a README update:

- purely visual spacing or color tweaks with no setup/config impact
- internal refactors that preserve public file locations and configuration names
- bug fixes that do not alter user-configurable behavior

Before finishing a frontend task, check:

```bash
git diff -- frontend/README.md
```

If the README should have changed and did not, update it before final handoff.

## Configuration Map

Current important configuration locations:

- Slider defaults: `frontend/app/page.tsx`, `defaultObjectiveWeights`
- Slider labels and backend field names: `frontend/app/page.tsx`, `objectives`
- Slider-to-agent payload: `frontend/app/page.tsx`, `toBackendWeights(...)`
- Shared frontend view model and data-source adapters: `frontend/data/atlasViewModel.ts`
- Mock ranking logic: `frontend/data/atlasViewModel.ts`, `calculatePriorityScore(...)` and `rankAreas(...)`
- Priority heatmap color scale: `frontend/priorityColor.ts`, `PRIORITY_COLOR_STOPS`
- Mock restoration area data: `frontend/mockData.js`, consumed through the demo adapter
- Backend Preview sample inputs: `agents/sample_outputs/` and `api/sample_responses/`, consumed through the backend adapter
- Map component: `frontend/components/EthiopiaPriorityMap.tsx`
- Map join/rendering helpers: `frontend/mapRenderer.ts`
- Mock priority results: `frontend/mock_priority_results.json`
- Admin boundary GeoJSON: `frontend/public/ethiopia_admin_boundaries.geojson`

## Implementation Guidance

- Keep frontend logic modular enough that mock data can later be replaced by API
  calls from ingestion and agent pipelines.
- Do not hard-code assumptions that mock scores or mock areas are final.
- Prefer typed helper functions for scoring, payload construction, and map joins.
- Preserve the clickable demo flow unless the task explicitly changes it.
- Keep map logic isolated from general page layout.
- Keep mock geospatial and recommendation data in separate data files.

## Verification

For meaningful frontend changes, run:

```bash
npm run build
```

from `frontend/`.

If you cannot run the build, say why in the final response.
