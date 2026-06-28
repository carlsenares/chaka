# Admin Upload Ingestion Pipeline

This pipeline stages NGO/admin uploads before they enter the system. It is designed for the future admin screen, but it is not connected to the frontend yet.

## Purpose

Admin uploads can mean two different things:

- a local paper, report, thesis, or field note that belongs in the local knowledge/RAG layer;
- a new source or dataset candidate that may belong in the source registry or data-ingestion roadmap.
- data from a known or proposed source that may become scoring input after schema, license, and QA review.

The pipeline decides which queue an upload should enter and records why. Every upload receives a `primary_route` so the admin screen can explain the decision. It does not update scores, mutate the registry, run extractors, or change the frontend.

## Command

Put files in:

```text
data/admin_uploads/inbox/
```

Run deterministic triage:

```bash
npm run data:admin-uploads:triage
```

Run with optional OpenAI classification:

```bash
npm run data:admin-uploads:triage:openai
```

Useful flags:

```bash
node scripts/admin-upload-ingestion-pipeline.mjs --input path/to/uploads --dry-run
node scripts/admin-upload-ingestion-pipeline.mjs --copy-to-staging
```

## Outputs

The pipeline writes:

```text
data/admin_uploads/upload_manifest.json
data/admin_uploads/triage_results.json
data/admin_uploads/handoff/local_knowledge_queue.json
data/admin_uploads/handoff/source_candidate_queue.json
data/admin_uploads/handoff/scoring_data_queue.json
data/admin_uploads/reports/admin_upload_triage.md
```

The manifest records file identity, size, checksum, and duplicate status.

The triage file records classification, confidence, rationale, signals, review status, and downstream handoff instructions.

## Classification Classes

The important field for the admin screen is `primary_route`:

- `source_registry_candidate`
  - A new permanent source candidate. Think source matrix/catalog entry.
- `scoring_data_review`
  - Data from a known or proposed source, including reliable-source documents with tables/measurements, that might feed scoring after parser and QA work.
- `local_layer_ingestion`
  - Local paper, report, field note, or thesis that should go through the local knowledge parser/RAG flow.
- `manual_review`
  - Duplicate, unclear, unsupported, or unsafe to route automatically.

- `local_knowledge_document`
  - PDF/text-like document with Ethiopia/local-place and research/restoration signals.
  - Queue for PDF-to-Markdown, document analysis, evidence cards, and local knowledge review.

- `source_candidate`
  - New source descriptor, URL, provider metadata, or catalog-like upload.
  - Queue for provider/license/coverage/access review before any extractor work.

- `scoring_data_candidate`
  - CSV/JSON/GeoJSON/raster/archive that looks like data from a known source or scoring matrix.
  - Reliable-source document that appears to contain structured measurements, tables, units, or source metadata that may become scoring input.
  - Queue for source identity, source authority, schema/table extraction, unit, geography, date, license, parser, and QA review.

- `duplicate`
  - Same checksum as an existing local knowledge source.

- `manual_review_document`
  - Document-like upload where relevance is unclear.

- `unsupported_or_unclear`
  - File type or content is not enough for automatic routing.

## Safety Boundary

The pipeline is intentionally conservative. It never:

- changes score weights;
- updates `data/features/`;
- updates `models/`;
- writes frontend files;
- mutates `data/catalog/source_registry.json`;
- promotes scoring data into `data/features/`;
- accepts license terms;
- ingests large datasets automatically.

Promotion into local knowledge or data ingestion is a separate reviewed step.

## Prompt-Injection Safety

All uploaded text is treated as untrusted evidence, not instructions.

The triage output includes `prompt_injection_review` for every upload:

```json
{
  "risk_level": "low | medium | high",
  "matched_patterns": [],
  "handling": "..."
}
```

If a file contains instruction-like text such as "ignore previous instructions", "system prompt", "developer message", requests for secrets, command execution, or similar override language, the deterministic classifier routes it to `manual_review`.

When OpenAI classification is enabled, the model prompt explicitly instructs the model to ignore instructions inside uploaded content. The uploaded document text is only evidence for classification.

## Reliable Source Documents For Scoring

Admins may upload a document from a reliable source that should eventually affect scoring, for example an official government dataset report, university measurement table, FAO/WRI/NASA/ESA source document, or peer-reviewed paper with extractable values.

Those uploads should route to:

```text
scoring_data_candidate -> scoring_data_review
```

They still do not update scores directly. A reviewer must verify:

- source authority;
- license and permission;
- geography and date;
- table/measurement extraction quality;
- units and conversion method;
- mapping to canonical feature fields;
- whether a parser/extractor already exists or must be built.

## Future Admin Screen Integration

The admin screen can eventually call this pipeline after upload and show:

- classification;
- confidence;
- duplicate warning;
- recommended queue;
- reason/rationale;
- required reviewer action;
- next commands or automated backend jobs.

For the MVP, the admin UI only needs to upload files and show the generated triage report. Account-based permissions can come later.
