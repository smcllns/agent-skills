# atag companion CSS simplification handoff

## What changed

- Replaced `skills/atag/companion/atag-callouts.css` with a smaller progressive-enhancement stylesheet.
- The CSS now supports both Obsidian's rendered callout DOM and Markdown Preview Enhanced / Cursor-style HTML exports.
- Synced the stylesheet into the Claude and Codex plugin copies.

## Important details

- Obsidian selectors intentionally use only `data-callout="note"` and `data-callout="done"`; the atag protocol already defines note as active and done as resolved, so `data-callout-fold` is redundant.
- HTML exports do not include Obsidian's `data-callout-fold`, so the HTML fallback styles all `note` and `done` callouts under `.markdown-preview` / `body[for="html-export"]`.
- Callout frames intentionally avoid rounded full-border card styling. The useful state marker is the square left accent strip plus active/done background.
- Human speaker labels use the same label shape as agent labels, with a stronger state-accent border.
- The CSS keeps section divider comments only; the implementation comments were removed.

## Verification

- HTML: injected the stylesheet into `skills/atag/dev/fixture.html`, served it locally, and captured `/private/tmp/atag-html-active.png`.
- Obsidian: copied `skills/atag/dev/fixture.md` and a temporary snippet into the active `obsidian` vault, temporarily disabled the older `comment-threads` snippet to avoid old selector interference, captured `/private/tmp/atag-obsidian-active.png`, restored `comment-threads`, then removed the temp note/snippet.
- Obsidian computed styles confirmed active/done color variables, turn dividers, `inline-block` speaker labels, and highlighted human labels.
- `rg data-callout-fold skills/atag/companion/atag-callouts.css ...` returned no matches.
- CSS copies matched between canonical, Claude plugin, and Codex plugin.
- Full tree drift checks were not used for the follow-up selector change because `skills/atag/scripts/atag-poll.sh` had unrelated in-flight changes.
