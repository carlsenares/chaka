---
name: "source-command-demo-check"
description: "Run the DEMO.md pre-demo checklist"
---

# source-command-demo-check

Use this skill when the user asks to run the migrated source command `demo-check`.

## Command Template

Walk through DEMO.md and verify each item, reporting what's missing:
1. Offline / seed-data fallback exists (venue wifi will fail).
2. The real deployed URL is reachable from a phone.
3. The Playwright happy-path test passes (no broken click on stage).
4. Demo data is preloaded so nothing must be typed live.
