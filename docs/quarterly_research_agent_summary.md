# Quarterly Research Agent Summary

The quarterly research agent keeps Chaka's source monitoring current without touching the frontend, ranking outputs, model artifacts, or feature data. It is a review-and-recommendation agent, not an automatic ingestion or scoring agent.

## What It Does

The agent runs a quarterly source refresh pass for the restoration-prioritization data stack. It checks whether known sources are reachable, whether high-value monitored sources appear to have changed, which sources require manual approval, and whether new source leads should be reviewed.

Default command:

```bash
npm run data:sources:quarterly-refresh
```

With OpenAI source discovery:

```bash
npm run data:sources:quarterly-refresh:research
```

## What It Checks

The agent separates source coverage into three layers:

1. Registry URL checks

   It runs `data:registry:check`, which probes every source URL listed in `data/catalog/source_registry.json`.

2. Specialist access probes

   It runs `data:sources:check`, which probes curated difficult or important sources such as WaPOR, GHSL, NHM BII, GFW carbon, WDPA, KBA, and IUCN.

3. High-value freshness checks

   It runs `data:sources:updates`, which checks a smaller curated list of high-value sources for update metadata, access status, version changes, and manual-review risk.

## What It Writes

Each run writes a machine-readable artifact:

```text
data/catalog/quarterly_source_refresh/<YYYY-Qn>.json
```

It also writes a human-readable report:

```text
docs/reports/quarterly_source_refresh_<YYYY_Qn>.md
```

It also refreshes the admin-review contract:

```text
data/catalog/source_review_queue.json
```

The report includes:

- registry source count and URL-check coverage
- specialist access-probe coverage
- high-value freshness-monitor coverage
- changed high-value sources
- blocked or manual-review sources
- recommended safe extractor rerun commands
- OpenAI-discovered source candidates, when enabled
- risks and manual-review notes

The review queue includes approval state and an ingestion plan for each source. Until the admin dashboard is connected, use `npm run data:sources:review:list` and `npm run data:sources:review -- --approve <id>`.

## OpenAI Role

OpenAI is optional and advisory. When `OPENAI_API_KEY` is available and the research command is used, the agent performs a web-backed source-discovery pass through the OpenAI Responses API.

This pass can suggest new source candidates, access caveats, citations, and next actions. It cannot change scoring, invent numeric features, mutate the registry, or ingest data.

If no API key is present, the agent still succeeds and records that OpenAI discovery was skipped.

## What It Does Not Do

The agent does not:

- run feature extraction
- run ranking
- retrain models
- update frontend files
- update map data directly
- download large restricted datasets
- accept license terms
- turn OpenAI source suggestions into trusted data automatically

Extractor reruns are only triggered after explicit approval through the source review queue. When a reviewed source has configured extractor commands, approval immediately runs ingestion, feature rebuild, ranking, and artifact validation. New source candidates without extractors stay approved-but-not-ingested until engineering adds the safe ingestion path.

## Why It Exists

The agent gives Chaka a credible maintenance story: the system is not a static demo with stale data. Every quarter, it can verify reachable sources, identify broken or changed sources, flag manual-review blockers, and search for new source leads without destabilizing the app or silently changing scores.

This supports the core system design: deterministic scoring remains controlled and auditable, while OpenAI is used where it is strongest, for research triage, source discovery, and administrative assistance.
