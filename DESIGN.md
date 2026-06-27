# DESIGN.md — house style

> Read this before writing any UI. These are pre-made decisions so we start at
> the idea, not at "which font." The default is deliberately **not** the
> Inter-on-white template every AI demo ships. Tune per project, but start here.

## Stack
- **Next.js + Tailwind + shadcn/ui** as the base component layer.
- **Aceternity UI / Magic UI** for hero moments only (don't overuse).
- **Framer Motion** + **Anime.js** for motion. **lucide-react** for icons.
- **next-themes** for dark mode.

## Type
- Headings: a characterful grotesque — **General Sans** or **Geist**.
- Body: a clean neutral. One pairing, no exceptions.

## Color
- Approach is fixed even when the palette changes per project:
  **neutral base + ONE bold accent.** Semantic tokens in **OKLCH**.
- Generate palettes with Realtime Colors / Coolors. Check contrast with
  Inclusive Colors. **Dark-mode-first.**

## Space & motion
- 8pt grid. Generous whitespace. `max-w` content column.
- Motion is **purposeful only**: ease-out, 150–250ms, every state change
  acknowledged. Nothing decorative. (Use the `impeccable` vocabulary:
  `polish`, `audit`, `animate`, `bolder`, `quieter`.)

## Quality gates (run before demo)
- `frontend-design` skill informs structure; `impeccable` polishes.
- **Web Interface Guidelines** skill — audit a11y/perf/UX (also the inclusion story).
- `playwright` skill — agent self-tests the happy path before you present.

## Installed by `scripts/setup`
```
npx shadcn@latest init
npm i framer-motion animejs lucide-react next-themes
# skills: frontend-design, impeccable, web-interface-guidelines, playwright
```
