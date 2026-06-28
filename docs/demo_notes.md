# Demo Notes

Working notes for the product demo, video walkthrough, and presentation. Keep
this file practical so the demo decisions do not need to be reconstructed.

## Current Demo Position

The live demo should be a guided video walkthrough with spoken commentary, not a
fragile live sequence where judges wait for backend jobs.

The core story:

1. The geospatial pipeline ranks candidate restoration areas from reproducible
   source-derived layers.
2. Uploaded/local PDFs become a separate local knowledge layer.
3. OpenAI turns those PDFs into document analysis, evidence cards, citations,
   and vector-searchable local context.
4. The candidate page uses that context to explain caveats and investment ideas
   without changing the deterministic score.
5. Over time, NGO investment decisions and monitoring data can become training
   data for a better future model.

Do not present this as an LLM calculating the land score.

## Demo Asset

Best source for the demo:

```text
research/source_candidates/papers/Alemayehu Haile.pdf
```

Why:

- It is about Gimbo District.
- Candidate `SWE-007` is in Gimbo.
- Extracted cards include soil erosion, soil conservation practices, labor
  constraints, fertilizer/compost practice, and implementation barriers.
- It lets the audience see the path from a real local document to cited local
  investment caveats.

## Walkthrough Shape

Show, in this order:

1. Original PDF or source reference.
2. Source catalog entry.
3. OpenAI-created document analysis.
4. OpenAI-created evidence cards with page citations.
5. `SWE-007` recommendation page.
6. Local intelligence JSON only briefly, as proof of the backend contract.
7. Explain that OpenAI vector search helps retrieve relevant evidence, then a
   local policy reranker enforces geography, confidence, and no-score-override
   rules.

Useful live URLs:

```text
https://chaka-os.org/
https://chaka-os.org/knowledge/sources
https://chaka-os.org/knowledge/upload
https://chaka-os.org/recommendations/SWE-007
https://chaka-os.org/api/sites/SWE-007/intelligence
```

## OpenAI Usage

OpenAI is part of the actual backend, not just presentation language.

Current live intelligence endpoint uses:

- OpenAI Responses API for site intelligence synthesis.
- OpenAI vector store search for local evidence retrieval.
- Local deterministic reranking after vector retrieval.
- A deterministic fallback if the OpenAI call exceeds the serving budget.

The second OpenAI citation-audit call is disabled on the live endpoint for
latency. It should be framed as an admin/deep-analysis step, not a blocking page
load.

If showing pipeline stages, use this wording:

```text
Uploaded -> PDF parsed -> OpenAI document triage -> evidence cards extracted
-> vector store synced -> ready for investment intelligence
```

Do not frame this as a manual "Run OpenAI analysis" step for normal uploads.
Uploads should trigger processing automatically. Manual controls are for retry,
refresh, admin QA, and source-update checks.

## Frontend Decision

Do not build a separate complex admin frontend before understanding the coworker
frontend.

Agreed direction:

1. Inspect the coworker design/function code first.
2. Understand routes, components, state, and expected data.
3. Avoid a blind merge.
4. Prefer selectively rebuilding or cherry-picking useful UI pieces into the
   current working app.
5. Keep current live app stable while integrating the real UI direction.

Reason:

- Adding new admin UI now may create integration debt.
- The real UI has to come in sooner or later.
- It is safer to understand the coworker frontend and adapt current backend
  contracts to it than to invent new pages it does not know about.

## Frontend Integration Progress

Started with the safest reusable slice from the coworker frontend idea:

- Added a grounded "Explain this recommendation" chat panel to the current live
  dashboard.
- Added `POST /api/explainable-chat`.
- The chat route loads the selected canonical site, ranking context, local
  evidence cards, recommendation object, model prediction, critic output, and
  current weight settings.
- The route answers with OpenAI when available and falls back to deterministic
  local context if OpenAI fails or times out.
- Public smoke test returned a grounded answer for `SWE-007` in about five
  seconds.
- Copied/adapted Julia's Ethiopia admin-boundary map instead of merging the
  whole frontend branch.
- The live dashboard now renders HDX/OCHA Admin 2 boundaries with backend
  candidate priority results joined by zone PCODE.
- `SWE-007` joins to the Kefa boundary (`ET1102`), so the video can show a real
  Ethiopia-focused map surface and then drill into the candidate/recommendation
  details.
- Switched the app theme toward Julia's warm NGO decision-support palette so
  copied UI components render correctly.
- Restyled dashboard cards, ranked list, weight controls, and chat panel for the
  light operational UI.
- Added the Ethiopia map to the recommendation detail page so the drill-down
  keeps geographic context.
- Reworked the dashboard around a large frameless Ethiopia map on the left and a
  compact right-side ranking/settings panel.
- Removed the old left-side selected-card/chat stack and moved Chaka chat into a
  floating launcher with an `AM / EN` language-toggle shell.
- Ranking cards now show only score, official place name, and a detail arrow;
  clicking the name focuses the map, while the score/arrow opens the detail page.
- Detail-page local evidence cards now link to the original PDF source at the
  cited page.

This is not the full coworker UI integration yet. It is a backend-compatible
frontend feature that can be moved or restyled when the larger UI is rebuilt or
cherry-picked.

## Future Product Ideas To Preserve

Admin/control-plane concepts are still valuable, but likely after UI direction is
clear:

- Upload local PDFs/reports/web pages/source data.
- Auto-classify whether a source belongs in scoring data, local caveats, or both.
- Research agent checks known sources for updates periodically or on admin
  request.
- Admins record investments in specific sites.
- Monitoring tab tracks outcomes after an investment.
- Future model can learn from accumulated site, investment, and outcome data.

These are product roadmap/demo narrative items unless implemented.
