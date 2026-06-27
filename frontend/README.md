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

## Default View

The app opens directly into the interactive prioritization workspace, not a
landing page. The workspace shows the Ethiopia map, ranked candidate areas,
compact selected-area details, a Change Priority Weights action, a collapsed
Current Priority Weights toggle, and the Demo/Backend data-source toggle on
first load.

The old landing and step-flow components remain in `frontend/app/page.tsx` for
future reuse, but the default `step` state is `dashboard`.

## Recommendation Detail Pages

Detailed rationale and evidence now live on dedicated recommendation pages:

```text
frontend/app/recommendations/[areaId]/
```

Dashboard ranked candidate cards link to:

```text
/recommendations/:areaId?source=demo
/recommendations/:areaId?source=backend
```

The `source` query parameter preserves whether the user is viewing Demo
(Mock Data) or Backend Preview. The detail page resolves areas through the
shared view-model utilities in:

```text
frontend/data/recommendationViewModel.ts
```

Use `area.id` or `area.pcode` as stable identifiers when linking to a
recommendation. Do not parse raw mock data or raw backend sample output directly
inside route components.

## Change Priority Weights

Priority sliders now live on a dedicated configuration page:

```text
frontend/app/change-priority-weights/page.tsx
```

The dashboard links to:

```text
/change-priority-weights?source=demo
/change-priority-weights?source=backend
```

Current weights are persisted in browser local storage with the key:

```text
chaka.priorityWeights
```

The shared read/write helpers live in:

```text
frontend/data/priorityWeightsStorage.ts
frontend/hooks/usePriorityWeights.ts
```

The shared slider and compact summary UI live in:

```text
frontend/components/PriorityWeightControls.tsx
```

When the user clicks "Re-prioritize", the page saves the selected weights and
returns to the dashboard. For now, the dashboard recomputes rankings locally for
Demo mode and preserves Backend Preview sample scores. A TODO in the route marks
where a future prioritization API call should replace local persistence.

## Changing Default Slider Values

The restoration objective slider defaults live in:

```text
frontend/data/prioritizationConfig.ts
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
`objectives` array in `frontend/data/prioritizationConfig.ts`.

The frontend currently converts slider values into this shape:

```ts
{
  biodiversity_weight: 90,
  carbon_weight: 75,
  water_weight: 85,
  livelihood_weight: 80,
}
```

That conversion happens in `toBackendWeights(...)` in
`frontend/data/prioritizationConfig.ts`. This is the object that can later be
sent to the prioritization agent.

## Mock Ranking Logic

For now, changing a slider recomputes the mock priority ranking in the browser.
The scoring function is:

```text
calculatePriorityScore(...)
```

in `frontend/data/atlasViewModel.ts`.

Mock restoration area data lives in:

```text
frontend/mockData.js
```

## Priority Heatmap Colors

Priority colors are generated from a continuous score scale in:

```text
frontend/priorityColor.ts
```

The highest displayed priority score maps to dark green, the lowest displayed
priority score maps to red, and intermediate values interpolate through
green, yellow-green, yellow, and orange. The ranked list, map polygons, map
legend, and side-panel score badges all use this shared utility.

To adjust the palette, update `PRIORITY_COLOR_STOPS` in that file. Keep the
array ordered from highest priority to lowest priority.

## Explainable Chatbot

The explainable chatbot is an optional explanation layer for the selected
restoration recommendation. It answers questions about why an area ranks highly,
which indicators contributed most, trade-offs across biodiversity/carbon/water/
livelihood, methodology, assumptions, and limitations.

The chatbot code lives in:

```text
frontend/chatbot/
```

The feature flag is configured in:

```text
frontend/config/features.ts
```

It reads:

```text
NEXT_PUBLIC_ENABLE_CHATBOT=false
```

The chatbot is disabled by default. To enable it locally, create `frontend/.env`
from `frontend/.env.example` and set:

```text
NEXT_PUBLIC_ENABLE_CHATBOT=true
OPENAI_API_KEY=your_server_side_key
OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_API_KEY` is used only by the server-side API route. The browser never
calls OpenAI directly. The public flag only controls whether the lazy-loaded UI
is mounted. When disabled, the chatbot component is not rendered and no chat
state or API call is initialized.

The public integration surface is the lazy-mounted component exported from:

```text
frontend/chatbot/index.ts
```

The Next.js route is:

```text
frontend/app/api/explainable-chat/route.ts
```

That route delegates to `frontend/chatbot/api/route.ts`, which streams grounded
responses from the OpenAI API using the selected ranked area, ranked candidate
areas, adapted backend/sample outputs, and methodology snippets.

## Data Flow: Mock Now, Backend Later

The frontend currently uses local mock data so the demo works without a backend.
These files are the main frontend data inputs today:

```text
frontend/mockData.js
frontend/mock_priority_results.json
frontend/public/ethiopia_admin0_boundary.geojson
frontend/public/ethiopia_admin_boundaries.geojson
```

Current responsibilities:

- `frontend/mockData.js`: region summaries, ranked restoration area cards,
  impact scores, rationale text, interventions, and export-preview values.
- `frontend/mock_priority_results.json`: map recommendation results shaped like
  future backend outputs.
- `frontend/public/ethiopia_admin0_boundary.geojson`: Ethiopia Admin 0 country
  boundary used only for the map focus mask, country outline, and national
  visual hierarchy. Source: geoBoundaries ETH ADM0.
- `frontend/public/ethiopia_admin_boundaries.geojson`: administrative boundary
  polygons used by the map.

For the map, recommendation results are joined to administrative boundary
features by PCODE or another administrative identifier. That join logic lives in:

```text
frontend/mapRenderer.ts
```

Future backend recommendation output should use this kind of shape:

```json
{
  "admin_level": 3,
  "pcode": "ET...",
  "priority_score": 91,
  "biodiversity_score": 94,
  "carbon_score": 88,
  "water_score": 92,
  "livelihood_score": 89,
  "rationale": "Why this area is prioritized",
  "confidence": "High",
  "evidence": "Source summary"
}
```

The long-term backend flow should be:

```text
AI recommendation
  -> PCODE or admin identifier
  -> lookup matching boundary polygon
  -> render highlighted polygon on the map
  -> populate dashboard and side-panel metrics
```

When the backend is connected, replace local mock imports/fetches with API
responses that preserve the same field names where possible. If the backend
changes field names or data shape, update this README and the frontend mapping
helpers in the same change.

## Switching Data Sources

The app has two interchangeable data-source modes in the same UI:

- `Demo (Mock Data)`: uses the existing frontend mock data.
- `Backend Preview`: uses committed backend sample outputs and API sample
  responses to show how the same interface looks with AI pipeline data.

The mode toggle is rendered near the page title in:

```text
frontend/app/page.tsx
```

The shared data model and adapters live in:

```text
frontend/data/atlasViewModel.ts
```

Current adapter inputs:

```text
Demo adapter:
frontend/mockData.js
frontend/mock_priority_results.json

Backend Preview adapter:
agents/sample_outputs/SWE-001.recommendation.json
agents/sample_outputs/SWE-001.critic.json
agents/sample_outputs/SWE-001.brief.json
api/sample_responses/sites.json
api/sample_responses/site_detail_SWE-001.json
```

The React UI should consume the shared view model rather than importing raw mock
or backend files directly. This keeps the interface identical while only the data
source changes.

Backend samples currently use `site_id`, while the map needs PCODE/admin IDs to
join recommendations to boundary polygons. Until the backend returns PCODEs
directly, the adapter contains a temporary `site_id -> pcode` bridge. Replace
that bridge when `GET /prioritization` or `GET /pipeline/latest` returns admin
identifiers.

Future live API integration should replace the sample-output imports inside
`frontend/data/atlasViewModel.ts` with a fetch/API client that returns the same
shared view model shape.

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
