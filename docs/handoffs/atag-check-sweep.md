# atag check/sweep handoff

## Current shape

Markdown Agent Tags should ship as one co-designed skill and CLI:

- `SKILL.md`: high-level behavior, strategy, outcomes, and human-agent thread contract.
- `skills/atag/scripts/atag`: canonical mechanics for checking and sweeping.
- Plugin commands/surfaces: ergonomic entry points over the CLI.

## Naming

Use the repo naming policy in `docs/naming/atag.md`.

- CLI/package/module: `atag`
- User-facing construct: `@agent` tag / agent tags
- Native commands: `atag check`, `atag sweep`
- Claude in-app commands: `agent-tags:check`, `agent-tags:sweep`
- Codex in-app surface: skill/action entries for check and sweep unless Codex command namespaces are verified.

Avoid implementation-shaped names like `sweep-agent-tags-to-footnotes` for product surfaces.

## Behavior contract

`check` means "look for actionable tags":

- `atag check --dir docs`
- `atag check --list --dir docs`
- `atag check --watch --dir docs -- --model sonnet`

`sweep` means "archive existing agent tag threads out of the reading flow":

- Default: resolved only, leave trace.
- `--resolved` / `-r`: sealed `[!DONE]-` threads.
- `--all` / `-a`: active `[!NOTE]+` plus all `[!DONE]-`; explicit because it touches live threads.
- `--trace` / `-t`: leave a footnote reference where the thread was.
- `--t0`: remove the in-context trace.
- `--dry-run`: preview counts/targets without mutation.

## Known ambiguity

Codex plugin command namespaces are not currently documented in the local `.codex-plugin/plugin.json` spec. It documents skills, hooks, MCP servers, apps, and `interface.defaultPrompt`, but not a Claude-style `commands/` folder. Ship Codex-visible skill/action entries unless newer implementation evidence proves command namespace support.

The other ambiguity is `sweep --t0`: if it appends unreferenced markdown footnote definitions, some renderers may not show them. A normal bottom appendix may be more portable. Decide before coding.

## Plan review

Ambiguity review is done. Only `--t0` archive format remains a product decision. Codex command namespacing is treated as unsupported until proven otherwise.

Over-engineering review is done. Keep one CLI implementation, no new dependencies, no config/state/daemon work, and no general markdown-footnote engine.
