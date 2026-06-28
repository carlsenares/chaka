# Quarterly Research Agent

The quarterly research agent keeps source monitoring separate from ingestion, scoring, and frontend work. It checks known high-value sources, compares them with the previous quarterly artifact, optionally runs an OpenAI web-search discovery pass for new source leads, and writes review artifacts.

## Commands

- `npm run data:sources:quarterly-refresh`
  - Runs registry URL probes, specialist source-access probes, high-value source freshness checks, and writes `data/catalog/quarterly_source_refresh/<period>.json` plus `docs/reports/quarterly_source_refresh_<period>.md`.
- `npm run data:sources:quarterly-refresh:skip-probes`
  - Uses existing source-check artifacts without hitting external services again.
- `npm run data:sources:quarterly-refresh:research`
  - Adds OpenAI web-search source discovery when `OPENAI_API_KEY` is available.
- `npm run data:sources:quarterly-refresh:validate -- data/catalog/quarterly_source_refresh/2026-Q2.json`
  - Validates a generated artifact.

Use `--period YYYY-Qn` to backfill or force a report period.
Use `--skip-registry-check` only when you intentionally do not want to probe every `source_registry.json` URL.

## Operating Schedule

Run it once per quarter. Monthly is too noisy for most restoration datasets, and annual is too slow for access breakage, new dataset releases, and license changes.

Recommended cron shape:

```bash
0 8 1 1,4,7,10 * cd /path/to/chaka && npm run data:sources:quarterly-refresh
```

Use the OpenAI discovery pass once per quarter or before a demo:

```bash
OPENAI_API_KEY=... npm run data:sources:quarterly-refresh:research -- --period 2026-Q3
```

## Boundaries

The agent may read source catalogs, source-check outputs, and research-candidate notes. It may write quarterly source-refresh artifacts and reports. The default run also calls `data:registry:check`, which refreshes registry-derived inventory/check artifacts.

It must not write:

- `app/`
- `components/`
- `lib/`
- `public/`
- `models/`
- `reasoning/`
- ranking or feature output files

Extractor reruns are recommended in the report, not executed by default. This avoids silently changing map scores while UI or demo work is in progress.

The quarterly run also refreshes `data/catalog/source_review_queue.json`. This is the backend contract for the future admin dashboard: every known source that needs review and every newly discovered source candidate gets a stable review item, current source metadata, license/access caveats, and an ingestion plan.

## Admin Approval And Ingestion

The frontend admin dashboard is not connected yet, so `data/catalog/source_review_queue.json` is the current review interface. The future dashboard should read this file or an API backed by the same schema.

Every source review item has:

- `review_item_id`: stable ID used for approve/reject/block actions
- `queue_status`: `pending_review`, `approved`, `rejected`, `blocked`, or `monitored`
- `source_metadata`: provider, URL, access status, license status, caveats, evidence, and source fingerprint
- `ingestion`: whether approval can trigger ingestion, the extractor commands, post-update commands, and the last run result

New sources and changed/manual-review sources default to `pending_review`. They must not be ingested or used for scoring until an admin approves them.

When an admin approves a source with configured safe extractor commands, approval immediately triggers:

1. The source extractor commands listed in `ingestion.commands`.
2. `npm run data:features`.
3. `npm run data:rank`.
4. `npm run data:candidates:validate`.
5. `npm run data:artifacts:validate`.

When an admin approves a newly discovered source candidate without an extractor, the approval is recorded but no ingestion runs. That source stays an engineering/registry task until a safe extractor or access checker is added.

If a previously approved known source changes fingerprint in a later quarterly run, the old approval is not carried forward silently. The source is reopened for review so a human can check the new version, access terms, and downstream impact.

## Coverage Terms

- Registry URL checks cover every entry in `data/catalog/source_registry.json`.
- Specialist access probes cover the curated URLs in `scripts/check-source-access.mjs`, including known awkward sources such as WaPOR, NHM BII, GFW carbon, WDPA, KBA, and IUCN.
- High-value freshness checks cover the curated update-monitor list in `scripts/check-high-value-source-updates.mjs`; this list tracks version/update metadata and manual-review risk for sources we are actively considering for scoring or validation.

## OpenAI Role

OpenAI is advisory. The discovery pass uses the Responses API with web search to identify new source leads, citations, access caveats, and next actions. It does not create numeric features, change source eligibility, alter weights, or mutate the registry.

If no API key is present, the agent still succeeds and writes `openai_discovery.status = skipped_no_openai_key`.

## Review Flow

1. Run the quarterly agent.
2. Read the Markdown report.
3. Review `data/catalog/source_review_queue.json` or use the source review CLI.
4. For new source candidates, verify URL, license, Ethiopia coverage, and stable download/API access.
5. Add or modify extractors in a separate data-ingestion change.
6. Approve sources only when the license, access path, and ingestion boundary are acceptable.

Until the admin frontend exists, use the review queue CLI:

```bash
npm run data:sources:review:list
npm run data:sources:review -- --approve <source-or-candidate-id> --reviewer <name>
npm run data:sources:review -- --reject <source-or-candidate-id> --reviewer <name> --reason "Not suitable"
npm run data:sources:review -- --block <source-or-candidate-id> --reviewer <name> --reason "License terms unresolved"
```

Approving a source with configured extractor commands immediately runs those commands, then rebuilds features, rankings, and validation artifacts. Approving a brand-new source candidate without an extractor records the approval but does not ingest; it remains an engineering/registry task until a safe extractor exists.
