# DEMO.md — pitch & demo day

> The presentation is half the score, and every team forgets it until hour 23.
> This is your structural edge. Do these *before* the deadline crunch.

## The 60-second pitch skeleton
1. **The problem** — one sentence, named concretely (a real person, not "users").
2. **Why existing solutions miss** — position against the obvious approach.
3. **The demo moment** — show the one thing that works, live.
4. **How it works** — 1 sentence of tech, no more.
5. **The vision** — "today X, the same pipeline extends to Y."

## Demo-proofing (do these the night before)
- [ ] **Offline / seed-data fallback.** Venue wifi *will* fail. Seed the DB,
      mock external APIs, record a backup video. Never demo live-only.
- [ ] **Deploy to the real URL** (`./scripts/deploy`) and click it from a phone.
- [ ] **Run the `playwright` happy-path test** — no broken click on stage.
- [ ] Pre-load the demo data so nothing has to be typed live.

## Production tools (in TOOLBOX)
- **OpenScreen** — record the demo (auto-zoom, no watermark). Your backup video.
- **HyperFrames / Remotion** — polished HTML→video explainer.
- **Higgsfield / Kling** — AI hero/key-art → muted autoplay `<video>` + poster.

## Pitch one thing deep
If the idea has breadth (e.g. tutor + health), **pitch the vision broad, demo
one feature deep.** Judges punish breadth-without-depth.
