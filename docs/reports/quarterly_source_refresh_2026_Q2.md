# Quarterly Source Refresh 2026-Q2

Generated: 2026-06-28T05:15:58.139Z

## Executive summary

- Registry sources listed: 15
- Registry source URLs checked: 15
- Specialist access probes checked: 10
- High-value monitored freshness sources checked: 10
- High-value sources changed since previous artifact: 0
- High-value manual review required: 7
- New source candidates: 0
- OpenAI discovery status: skipped_not_requested

## Source coverage

- `source_registry.json` entries: 15
- Registry URL probes from `data:registry:check`: 15/15
- Specialist source-access probes from `data:sources:check`: 10
- High-value freshness/update monitor entries from `data:sources:updates`: separate curated list for source freshness, update metadata, and license/manual review risk
- Registry URL probes needing review: cifor_icraf_species_atlas

## High-value monitored source changes

- No changed high-value monitored sources detected against the previous quarterly artifact.

## Blocked or manual high-value sources

- gfw_forest_carbon_gross_removals: Probe returned download_blocked_or_requires_terms; confirm terms before ingestion.
- gfw_forest_carbon_gross_emissions: Probe returned download_blocked_or_requires_terms; confirm terms before ingestion.
- gfw_forest_carbon_net_flux: Probe returned download_blocked_or_requires_terms; confirm terms before ingestion.
- nhm_biodiversity_intactness_index: Probe returned download_blocked_or_requires_terms; confirm terms before ingestion.
- kba_world_database: Source requires license, account, or partner approval before automated ingestion.
- iucn_red_list_spatial: Source requires license, account, or partner approval before automated ingestion.
- nasa_gedi_l4b_agbd: Only landing-page or portal metadata is reachable; authenticated download flow needs review.

## New source candidates

- No new source candidates in this run.

## Safe rerun commands

- No extractor reruns recommended from this report.

## Proposed script or catalog changes

- medium: Move the hard-coded high-value source list into data/catalog/high_value_sources.json once the source set stabilizes.

## Risks and manual review queue

- The quarterly agent does not update scoring, feature artifacts, frontend routes, or model outputs.
- OpenAI-discovered sources are leads only; verify URL, license, coverage, and stable access before ingestion.
- License-gated datasets remain blocked until terms are accepted and redistribution/use constraints are documented.
