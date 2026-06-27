# default — hackathon scaffold

A generic, agent-agnostic starting point for AI hackathons. *Use this template*
→ fresh repo → start at the idea, not at architecture.

## Runbook
1. **Spawn** — *Use this template* on GitHub → clone the new repo.
2. **Boot the agent** — it reads `AGENTS.md` (Codex/Cursor/Aider) or `CLAUDE.md`
   (Claude Code) → runs `./scripts/setup` → does the kickoff audit.
3. **Set the idea** — work it out in a separate tab, paste the locked version
   into `BRIEF.md`. The build agent waits for this.
4. **Build** — house style is pre-decided in `DESIGN.md`; pull capabilities from
   `TOOLBOX.md` as needed.
5. **Deploy** — `cp .env.example .env.deploy`, fill it in, `./scripts/deploy`.
   Server-default, real HTTPS URL. Push to `main` auto-deploys via CI.
6. **Demo** — work through `DEMO.md` *before* the crunch (offline fallback!).

## Files
| File | Purpose |
|---|---|
| `AGENTS.md` / `CLAUDE.md` | agent boot + kickoff audit (one source of truth) |
| `BRIEF.md` | the idea slot — ideation happens elsewhere, lands here |
| `DESIGN.md` | house style (read before any UI) |
| `TOOLBOX.md` | generic capability menu |
| `DEMO.md` | pitch + demo-proofing |
| `DEPLOY.md` | server hosting (shared nginx gateway) |
| `scripts/{setup,deploy,tunnel}` | install / ship / dev-webhooks |
| `.github/workflows/deploy.yml` | push→live without server access |
| `.coderabbit.yaml` | automated PR review |

The Next.js `app/` base is added per project (or as a follow-up to this scaffold).
