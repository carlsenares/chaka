# Local Knowledge Upload Ingestion

## Feature Purpose

This feature lets NGOs, local researchers, professors, universities, and project
partners upload Ethiopia restoration papers, reports, theses, and field notes so
the local knowledge layer can improve over time.

The goal is not to let uploaded documents silently change priority scores. The
goal is to convert local research into traceable evidence that can:

- explain why a high-scoring area is promising;
- flag implementation caveats such as grazing, tenure, erosion, species choice,
  settlement pressure, or protected-area constraints;
- identify whether a source may later become eligible for scoring features;
- give the frontend cited local warnings and field-check questions.

## Product Position

This supports the open-source and partnership story:

Local NGOs and universities can contribute new research, the system turns it
into reviewable knowledge, and project teams get better local caveats and
investment reasoning without losing scoring transparency.

Suggested subpage:

```text
/knowledge/upload
```

Initial audience:

- NGO staff
- university researchers
- local project officers
- government or donor technical reviewers

The first version can be admin-only or local-only. Public upload moderation can
come later.

## Pipeline Decision

Use a staged pipeline, not a single quick card extraction pass.

Reason:

- A document-level analysis is needed to decide whether the source is relevant,
  local, current, methodological, subjective, or potentially scoring-eligible.
- Page-level evidence cards are needed for retrieval and citations.
- Calculation-ready facts require much stricter validation than implementation
  caveats.

Therefore the ingestion flow should be:

1. Document intake and metadata.
2. PDF to Markdown/page text.
3. Document-level triage and validity analysis.
4. Page/chunk-level evidence extraction.
5. Evidence validation and confidence scoring.
6. RAG/vector-store indexing.
7. Optional promotion queue for scoring-feature candidates.

## Stage 1: Upload And Metadata

User uploads a PDF and provides optional metadata:

- title
- authors
- year
- institution
- source type
- region/zone/woreda if known
- DOI or URL if available
- whether the uploader has permission to use it

The system assigns:

```json
{
  "source_id": "local_research_source:alemayehu_haile",
  "upload_id": "upload_20260628_001",
  "source_status": "uploaded_pending_processing"
}
```

## Stage 2: PDF To Markdown

Convert the PDF into page-aware Markdown/text:

```text
data/local_knowledge/markdown/{source_id}/page-001.md
data/local_knowledge/markdown/{source_id}/page-002.md
```

Each page must preserve:

- source id
- filename
- page number
- extracted text
- table text where available
- OCR status
- extraction warnings

Markdown is for human review and model extraction. The original PDF remains the
source of truth for citation.

## Stage 3: Document-Level Analysis

Before creating evidence cards, run one full-document analysis.

This answers:

- What geography does the document cover?
- Does it touch one candidate area, multiple candidate areas, or only national
  context?
- Which interventions or risks are discussed?
- Is the source peer-reviewed, official, thesis-level, NGO/project, or unclear?
- Is the document primarily data, interpretation, policy, narrative, or
  advocacy?
- Does it contain tables or measurements that could ever be used for scoring?
- What must not be inferred from it?

Example output:

```json
{
  "source_id": "local_research_source:alemayehu_haile",
  "document_use_class": "local_implementation_context",
  "geographic_scope": {
    "match_level": "woreda",
    "candidate_site_ids": ["SWE-007"],
    "places": ["Gimbo"]
  },
  "validity": {
    "overall_confidence": "medium",
    "subjectivity_risk": "medium",
    "method_clarity": "partial",
    "ocr_quality": "good"
  },
  "allowed_uses": ["implementation_caveat", "field_validation_question"],
  "blocked_uses": ["direct_score_override"],
  "scoring_candidate_facts": []
}
```

## Stage 4: Evidence Card Extraction

Extract small claim-level cards from pages/chunks.

Each card must include:

- claim
- source id
- page locator
- quote or table locator where allowed
- geography
- topics
- intervention tags
- confidence
- allowed use
- blocked use
- review status

Evidence cards are the primary retrieval unit for the intelligence layer.

## Stage 5: Validity And Confidence

Confidence is retrieval metadata, not a hidden score modifier.

Suggested factors:

| Factor | Higher Confidence | Lower Confidence |
| --- | --- | --- |
| Source type | official report, peer-reviewed paper | anecdotal, unclear, advocacy-heavy |
| Geography | candidate/woreda match | broad national or different region |
| Claim type | measured/table-derived | author opinion or vague narrative |
| Method clarity | methods, dates, units clear | methods missing or unclear |
| OCR quality | clean text/tables | scanned or garbled text |
| Recency | current/relevant period | outdated for current land use |

Use classes:

- `direct_calculation_candidate`: possible scoring input after manual QA.
- `implementation_caveat`: useful for warnings and project design.
- `narrative_context`: useful explanation, not decision-critical.
- `blocked_or_low_confidence`: do not show without review.

## Stage 6: RAG Indexing

Index both:

- page/chunk Markdown text;
- validated evidence cards.

Retrieval filters should include:

- site id
- region
- zone
- woreda
- place names
- intervention tags
- topics
- confidence
- allowed use
- source type

For the competition demo, prefer OpenAI-native components:

- OpenAI embeddings for semantic search;
- OpenAI vector stores / File Search for RAG;
- Structured Outputs for document analysis and evidence card schemas;
- Responses API for orchestration;
- Batch API for offline PDF processing;
- prompt caching for repeated extraction and reasoning prompts;
- traces/evals for showing the pipeline and validating answer quality.

Current implementation:

- Local evidence cards are saved in:

  ```text
  data/local_knowledge/evidence_cards.json
  ```

- A Markdown corpus for OpenAI File Search is saved in:

  ```text
  data/local_knowledge/evidence_cards_openai.md
  ```

- The corpus is synced to an OpenAI vector store, with metadata saved in:

  ```text
  data/local_knowledge/openai_vector_store.json
  ```

- Runtime retrieval supports a hybrid mode:

  ```bash
  LOCAL_KNOWLEDGE_RETRIEVAL=hybrid
  ```

Hybrid retrieval does not let semantic search override local policy. It uses
OpenAI vector store search to find semantically relevant evidence IDs, then the
local reranker still enforces geography, intervention relevance, confidence,
review status, and no-score-override rules.

For `SWE-007`, this means the Gimbo thesis evidence from `Alemayehu Haile.pdf`
stays ranked above broad national context, even when OpenAI vector search also
finds relevant national forest or REDD material.

## OpenAI Model And Tool Routing

Use explicit model routing so the system shows both quality and cost discipline.

Current recommended routing:

| Pipeline Step | OpenAI Model / Tool | Why This Choice | Output |
| --- | --- | --- | --- |
| Upload intake metadata cleanup | `gpt-5.4-nano` via Responses API | Cheap, fast normalization task. | Clean source metadata JSON. |
| PDF page OCR cleanup / page classification | `gpt-5.4-nano` or `gpt-5.4-mini` via Batch API | High-volume, repetitive page tasks should be cheap and asynchronous. | Page topics, place hints, OCR warnings. |
| Full-document triage | `gpt-5.4-mini` with Structured Outputs | Needs enough reasoning to judge scope, source type, geography, and allowed uses. | Document analysis JSON. |
| Evidence card extraction | `gpt-5.4-mini` with Structured Outputs, preferably Batch API | Many chunk-level extraction calls with strict schema requirements. | Evidence cards. |
| Evidence-card support check | `gpt-5.4-mini`; escalate disputed cases to `gpt-5.5` | Validates whether the claim is actually supported by the cited page. | Confidence and review status. |
| Embedding generation | OpenAI embeddings model | Semantic retrieval over Markdown chunks and evidence cards. | Vector index records. |
| Retrieval | OpenAI vector stores / File Search plus local reranker | OpenAI-native semantic retrieval, constrained by local geography/confidence policy. | Retrieved citations for a site/intervention. |
| Site intelligence synthesis | `gpt-5.5` via Responses API, reasoning effort `medium` or `high` | This is the user-visible reasoning layer: explain score, investment ideas, caveats, citations. | Intelligence JSON for frontend. |
| Final critic / citation audit | `gpt-5.5` via Responses API, reasoning effort `medium` | Checks overclaiming, uncited claims, unsupported caveats, and score tampering. | Audit result and refusal notes. |
| Offline bulk reprocessing | Batch API | Cheaper asynchronous processing for many PDFs/chunks. | Updated analyses and cards. |
| Repeated prompt/schema calls | Prompt caching | Extraction and validation reuse long stable instructions and schemas. | Lower latency/cost on repeated calls. |
| Demo observability | Agents SDK traces / Responses traces | Shows the multi-step OpenAI workflow clearly to judges. | Traceable workflow spans. |

Model names can be configured in one place:

```json
{
  "models": {
    "cheap_classifier": "gpt-5.4-nano",
    "structured_extractor": "gpt-5.4-mini",
    "reasoning_synthesizer": "gpt-5.5",
    "critic": "gpt-5.5"
  }
}
```

If credits or availability are constrained, the fallback plan is:

- keep `gpt-5.5` only for final synthesis and critic;
- use `gpt-5.4-mini` for all extraction, validation, and routing;
- use Batch API for every non-interactive document-processing step.

## Stage 7: Scoring Promotion Queue

Some sources may contain calculation-useful facts. These should not immediately
alter scores.

Instead, create a promotion queue:

```json
{
  "candidate_fact_id": "fact:alemayehu_haile:soil_ph_table_4",
  "source_id": "local_research_source:alemayehu_haile",
  "page": 44,
  "variable": "soil_ph",
  "unit": "pH",
  "geography": "Gimbo",
  "date_or_period": "unknown",
  "extraction_method": "table_extraction",
  "manual_review_required": true,
  "status": "not_promoted"
}
```

A fact can become a scoring feature only after manual QA confirms:

- geography;
- date;
- units;
- method;
- extraction quality;
- compatibility with existing source layers.

## Intelligence Layer Integration

For a high-scoring site, the intelligence layer receives:

- canonical priority score;
- component scores;
- top feature contributions;
- recommended intervention seed;
- candidate metadata and geometry;
- retrieved evidence cards;
- document-level validity summaries.

It returns:

- score explanation;
- why this area;
- investment ideas;
- local caveats;
- field checks;
- citations;
- claims it refused to make.

The LLM must cite only retrieved evidence and must not change the priority score.

## Demo Narrative

Short version:

The geospatial pipeline ranks candidate areas. The OpenAI-native knowledge
pipeline turns local PDFs into cited evidence. The intelligence layer combines
both, explaining the score and drafting investment ideas while flagging local
risks from uploaded research.

This is stronger than a one-off chatbot because it creates a reusable knowledge
network for Ethiopian restoration research.

## Implementation Notes

Initial local files can live under:

```text
data/local_knowledge/
```

Suggested generated artifacts:

```text
data/local_knowledge/sources.json
data/local_knowledge/document_analyses.json
data/local_knowledge/evidence_cards.json
data/local_knowledge/scoring_promotion_queue.json
```

Future API routes:

```text
POST /api/local-knowledge/uploads
GET  /api/local-knowledge/uploads/{source_id}
GET  /api/sites/{site_id}/intelligence
```

Frontend pages:

```text
/knowledge/upload
/knowledge/sources
/recommendations/{site_id}
```
