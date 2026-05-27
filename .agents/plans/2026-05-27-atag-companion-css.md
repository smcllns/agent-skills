# atag companion CSS simplification

## Scope

Simplify `skills/atag/companion/atag-callouts.css` so it works as progressive enhancement in Obsidian and plain HTML exports / Cursor preview.

## Tasks

- [x] Inspect current CSS and fixture DOMs.
- [x] Replace overspecified Obsidian-only selectors with portable callout styling.
- [x] Remove redundant Obsidian `data-callout-fold` selectors; `note` and `done` are the protocol states.
- [x] Remove rounded full-border card treatment; keep square state strip and stronger human-label border.
- [x] Make no-colon speaker labels the canonical atag thread format and keep scanner compatibility for legacy colon labels.
- [x] Keep active/done color, turn dividers, and speaker-label styling.
- [x] Sync CSS to Claude and Codex plugin copies.
- [x] Verify with browser screenshot of styled fixture HTML.
- [x] Verify with Obsidian screenshot of styled fixture note.
- [x] Run cheap checks and summarize remaining gaps.

## Verification

- HTML fixture rendered through local browser at `/private/tmp/atag-html-active.png`.
- Obsidian fixture rendered through temporary vault note/snippet at `/private/tmp/atag-obsidian-active.png`; temp note/snippet removed after capture.
- Obsidian validation temporarily disabled the older `comment-threads` snippet so this file was tested without old selector interference; `comment-threads` was restored after capture.
- Obsidian computed styles confirmed active/done colors, dividers, and speaker label display.
- `rg data-callout-fold skills/atag/companion/atag-callouts.css ...` returned no matches.
- CSS copies matched between canonical, Claude plugin, and Codex plugin.
- Browser recheck confirmed square callout edges, no literal speaker-label colons, and matching inline-block label boxes for human/agent labels.
- Added ADR `docs/adrs/2026-05-27-atag-speaker-labels.md`.
- Full tree drift checks were skipped on the follow-up selector change because `skills/atag/scripts/atag-poll.sh` had unrelated in-flight changes.

## Open Questions

- None for v1; prefer simplest CSS that styles the known Obsidian and generated HTML structures.
