# Markdown Agent Tags

**Markdown Agent Tags** (`atag`) lets you leave `@agent` tags in markdown files for an AI agent to pick up asynchronously.

The implementation is the same canonical skill shipped in `skills/atag/`. This plugin wrapper only adds Codex discovery and install metadata.

## Usage

Ask Codex to run the skill on a path:

```text
Resolve @agent tags in docs/
```

or invoke it explicitly:

```text
Use atag on /path/to/notes
```

See `skills/atag/SKILL.md` for the protocol details: tag shapes, `[!NOTE]+` / `[!DONE]-` markers, scan commands, poller options, and discussion thread format.

## Obsidian styling (optional)

For a nicer look in Obsidian Reading mode, the repo ships a CSS snippet at `skills/atag/companion/atag-callouts.css`. Copy it into your vault's `.obsidian/snippets/`, then enable it via Settings → Appearance → CSS snippets. Renders amber for active threads, green for resolved.

## Tests

Run the canonical spec test from the repo root:

```bash
bun test skills/atag/reference/markdown-agent-tags.spec.test.ts
bun test skills/atag/reference/atag-poll.test.ts
```
