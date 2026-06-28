# Local Knowledge Demo Script

## Best Demo Source

Use:

```text
research/source_candidates/papers/Alemayehu Haile.pdf
```

Why:

- It is about Gimbo District.
- Candidate `SWE-007` is in Gimbo.
- The extraction produced concrete page-cited cards about soil erosion,
  conservation practices, and implementation barriers.
- This makes the local knowledge layer easy to explain without relying on a
  geographically broad national report.

## Demo Flow

1. Show the source catalog:

   ```text
   /knowledge/sources
   ```

   Explain that uploaded/local PDFs become source records with processing
   status, page counts, and Markdown artifacts.

2. Show the upload/intake surface:

   ```text
   /knowledge/upload
   ```

   Explain the future partner workflow: NGOs, universities, and local
   researchers upload new reports, and the system turns them into reviewed local
   knowledge.

3. Show `SWE-007`:

   ```text
   /recommendations/SWE-007
   ```

   Explain that the numeric score stays source-derived and deterministic.

4. Open the intelligence JSON:

   ```text
   /api/sites/SWE-007/intelligence
   ```

   Point out:

   - model used for synthesis;
   - retrieved evidence cards;
   - citations with source/page;
   - local caveats;
   - investment ideas;
   - audit status and notes.

   In hybrid mode, the response should show:

   ```json
   {
     "retrieval_strategy": "openai_vector_store_search_plus_local_policy_rerank"
   }
   ```

   Some retrieved evidence records include:

   ```text
   openai vector search
   ```

   in `match_reasons`. This proves OpenAI vector store retrieval contributed,
   while the local policy reranker still keeps Gimbo-specific evidence first.

## Talking Point

The system does not ask the LLM to invent local wisdom. It first converts PDFs
into page-aware Markdown, extracts structured evidence cards with OpenAI,
retrieves geographically and intervention-relevant cards, then uses the strong
reasoning model to explain the score and draft investment ideas.

Low-confidence or subjective sources are not discarded automatically. They are
allowed to produce cautious field-check questions, but not strong investment
claims or score changes.

## OpenAI Feature Story

- Structured Outputs create document analyses and evidence cards.
- Embeddings create semantic retrieval records.
- OpenAI vector stores / File Search provide hosted semantic search over the
  evidence-card corpus.
- Hybrid retrieval combines OpenAI vector search with deterministic geography,
  confidence, and allowed-use policy.
- Model routing uses cheaper models for extraction and stronger models for
  final reasoning.
- The intelligence endpoint uses `gpt-5.5` for synthesis.
- A separate audit model checks overclaiming and citation risk.

## Exact Demo Claim

Say:

The local score is still calculated from reproducible geospatial layers. OpenAI
turns uploaded PDFs into structured evidence, indexes that evidence in a vector
store, retrieves the most relevant local caveats, and then a stronger reasoning
model drafts investment ideas with citations. A final audit model checks that it
did not overclaim or modify the score.

Do not say:

The LLM calculates the score, verifies facts independently of the PDFs, or proves
that an investment will succeed.
