# Hackathon build — agent boot file

> This is the **first thing you read**. It is the canonical instruction file for
> every agent (Codex, Cursor, Aider, opencode all read `AGENTS.md`; Claude Code
> reads `CLAUDE.md`, which points here). One source of truth.

You are helping ship a project at a **hackathon**: short time box, judged on a
working demo. This repo is a generic, idea-agnostic scaffold. The idea is **not
set yet** — it arrives in `BRIEF.md`.

## Step 0 — run setup (do this before anything else)

```bash
./scripts/setup
```

This installs the shared skills + design deps and writes the MCP config for
whichever harness you are. It is idempotent — safe to re-run.

## Step 1 — kickoff audit (report back, then wait for my go)

1. **Which harness am I?** (Claude Code / Codex / Cursor) — load the matching
   skill + MCP format. `scripts/setup` already handled installs; just confirm.
2. **What does THIS hackathon mandate?** Required AI provider, rules, time box,
   submission format. If unknown, ask me.
3. **Read `BRIEF.md`.** If it's empty, the idea isn't locked — help me scope it
   *or* wait for me to paste it. Do not start building on a guessed idea.
4. **Which modules stay vs go?** Default: auth off, payments off. Turn on only
   what `BRIEF.md` needs.
5. **Map the repo** (optional, large/inherited code): run Graphify, flag edge
   cases and mismatches.

Output a short plan. **Then wait for my confirmation before building.**

## Conventions

- Stack: **Next.js (app router) + Tailwind + shadcn/ui**. Don't swap without reason.
- **Always read `DESIGN.md` before writing any UI.** It is the house style.
- Reach for capabilities in `TOOLBOX.md` only when the problem calls for them.
- Hosting is **server-default** (see `DEPLOY.md`). Never demo on localhost.
- Keep secrets in `.env` (never commit). `.env.example` documents every key.

## Workflow (so CodeRabbit actually reviews + main stays shippable)

CodeRabbit only reviews **pull requests**, and merging to `main` auto-deploys. So:
- Work on a branch → open a PR. CodeRabbit reviews it automatically.
- Merge the PR → that *is* the push to `main` → it deploys live.
- **Don't push straight to `main`** — you'd skip review and ship every push, broken or not.

At hackathon pace, keep PRs small and merge fast. The flow is light, not bureaucratic:
branch → PR → glance at CodeRabbit → merge → live.

## Going live (CI auto-deploy)

To enable push-to-live CI on this repo, run (or hand me the command to run):
```
./scripts/init-deploy <owner/repo>
```
That sets the 4 GitHub deploy secrets in one shot (3 default to this box; DEPLOY_DIR
is derived). Then `./scripts/deploy` — or merging to `main` — ships it. See `DEPLOY.md`.
Note: this writes secrets to GitHub and wires production deploy, so surface the exact
command to the user before running if anything about the target is unconfirmed.

## The LLM layer

Not pinned. Default to the best available Claude model; if the hackathon mandates
another provider, swap it at the single adapter point — don't thread a provider
through the codebase.
