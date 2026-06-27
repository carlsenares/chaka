# TOOLBOX.md — capability menu

> Generic baseline. Reach for these **only when the problem calls for it**.
> No per-hackathon plans live here — add those in `BRIEF.md` per run.

| If the problem needs… | Reach for | Note |
|---|---|---|
| A visual "wow" moment | `cobe` globe, Aceternity / Magic UI, Spline | hero only, don't overuse |
| Web data ingestion | Firecrawl → Crawl4AI → Camoufox | escalating: easy → anti-bot |
| Product analytics | PostHog | doubles as the "we measure impact" slide |
| Demo / pitch media | OpenScreen (record), HyperFrames / Remotion (explainer), Higgsfield / Kling (hero video) | see `DEMO.md` |
| Codebase comprehension | Graphify | also part of the kickoff audit |
| Receiving webhooks in dev | `./scripts/tunnel` (cloudflared) | public URL → localhost for testing |

## Module toggles (off by default)
Turn on only what `BRIEF.md` calls for:
- **auth** — add when the idea needs accounts.
- **payments** — rarely needed; add only if explicitly required.
- **database** — SQLite for zero-setup; Postgres when you need it for real.
- **RAG / vector** — pgvector when answering over documents.
- **real-time** — websockets when the demo needs live updates.
