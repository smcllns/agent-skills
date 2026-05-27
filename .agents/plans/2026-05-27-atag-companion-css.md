# atag companion CSS simplification

## Scope

Simplify `skills/atag/companion/atag-callouts.css` so it works as progressive enhancement in Obsidian and plain HTML exports / Cursor preview.

## Tasks

- [x] Inspect current CSS and fixture DOMs.
- [x] Replace overspecified Obsidian-only selectors with portable callout styling.
- [x] Keep active/done color, turn dividers, and speaker-label styling.
- [x] Sync CSS to Claude and Codex plugin copies.
- [x] Verify with browser screenshot of styled fixture HTML.
- [x] Verify with Obsidian screenshot of styled fixture note.
- [x] Run cheap checks and summarize remaining gaps.

## Verification

- HTML fixture rendered through local browser at `/private/tmp/atag-html-active.png`.
- Obsidian fixture rendered through temporary vault note/snippet at `/private/tmp/atag-obsidian-active.png`; temp note/snippet removed after capture.
- Obsidian computed styles confirmed active/done colors, dividers, and speaker label display.
- `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag` passed.
- `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag` passed.

## Open Questions

- None for v1; prefer simplest CSS that styles the known Obsidian and generated HTML structures.
