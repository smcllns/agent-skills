# md-asks

A Codex plugin that picks up inline `@claude`, `@codex`, or `@agent` asks in markdown files, does the requested edit in the document body, and wraps the exchange in a callout thread that can be continued if follow-up is needed.

The implementation is the same canonical skill shipped in `skills/md-asks/`. This plugin wrapper only adds Codex discovery and install metadata.

## Usage

Ask Codex to run the skill on a path:

```text
Resolve md asks in docs/
```

or invoke it explicitly:

```text
Use md-asks on ~/Projects/obsidian
```

See `skills/md-asks/SKILL.md` for the protocol details: ask shapes, `[!NOTE]+` / `[!DONE]-` markers, scan regex, and discussion thread format.

## Tests

Run the canonical spec test from the repo root:

```bash
bun test skills/md-asks/reference/markdown-agent-directives.spec.test.ts
```
