# atag companion CSS simplification handoff

## What changed

- Replaced `skills/atag/companion/atag-callouts.css` with a smaller progressive-enhancement stylesheet.
- The CSS now supports both Obsidian's rendered callout DOM and Markdown Preview Enhanced / Cursor-style HTML exports.
- Synced the stylesheet into the Claude and Codex plugin copies.

## Important details

- Obsidian remains scoped to `[!NOTE]+` and `[!DONE]-` through `data-callout-fold`, so ordinary `[!NOTE]` / `[!DONE]` callouts are left alone there.
- HTML exports do not include Obsidian's `data-callout-fold`, so the HTML fallback styles all `note` and `done` callouts under `.markdown-preview` / `body[for="html-export"]`.
- The CSS keeps section divider comments only; the implementation comments were removed.

## Verification

- HTML: injected the stylesheet into `skills/atag/dev/fixture.html`, served it locally, and captured `/private/tmp/atag-html-active.png`.
- Obsidian: copied `skills/atag/dev/fixture.md` and a temporary snippet into the active `obsidian` vault, captured `/private/tmp/atag-obsidian-active.png`, then removed the temp note/snippet.
- Obsidian computed styles confirmed active/done color variables, turn dividers, `inline-block` speaker labels, and highlighted human labels.
- `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag`
