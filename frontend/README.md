# Frontend Notes

This folder contains the Next.js frontend for the Chaka Priority Atlas demo.

## Agent Handoff Rule

Frontend-specific agent instructions live in:

```text
frontend/AGENTS.md
```

The root `AGENTS.md` remains canonical and superior. The frontend agent file is
only supplemental and must not override or modify root instructions without
explicit user permission.

When frontend code changes affect anything a teammate can configure or set up,
update this README in the same change. This includes slider defaults, backend
payload fields, map data locations, mock data shapes, run commands, environment
variables, and other user-visible configuration.

## Running the Frontend

From the repo root:

```bash
cd frontend
npm run dev
```

Build check:

```bash
cd frontend
npm run build
```

Running from inside `frontend/` keeps Next.js generated files, such as `next-env.d.ts`
and `.next/`, scoped to the frontend app.

## Changing Default Slider Values

The restoration objective slider defaults live in:

```text
frontend/app/page.tsx
```

Look for:

```ts
const defaultObjectiveWeights: ObjectiveWeights = {
  biodiversity: 90,
  carbon: 75,
  water: 85,
  livelihood: 80,
};
```

Change those numbers to update the initial slider values and the values restored by
the "Reset to Recommended" button.

## Slider Objectives and Backend Payload

The visible slider labels and future backend field names are defined in the
`objectives` array in `frontend/app/page.tsx`.

The frontend currently converts slider values into this shape:

```ts
{
  biodiversity_weight: 90,
  carbon_weight: 75,
  water_weight: 85,
  livelihood_weight: 80,
}
```

That conversion happens in `toBackendWeights(...)`, also in `frontend/app/page.tsx`.
This is the object that can later be sent to the prioritization agent.

## Mock Ranking Logic

For now, changing a slider recomputes the mock priority ranking in the browser.
The scoring function is:

```text
calculatePriorityScore(...)
```

in `frontend/app/page.tsx`.

Mock restoration area data lives in:

```text
frontend/mockData.js
```

## Map Data

Map rendering and geospatial mock data are separated from the page component:

```text
frontend/components/EthiopiaPriorityMap.tsx
frontend/mapRenderer.ts
frontend/mock_priority_results.json
frontend/public/ethiopia_admin_boundaries.geojson
```

Future backend geospatial outputs should plug into the map data layer by matching
recommendations to administrative boundary identifiers such as PCODE.
