# @smcllns/skills — agent marketplace

**Artisanal agent skills, harness upgrades, and field notes on cognitive witchcraft**

![Dark workbench of agent tools](docs/assets/skills-marketplace-hero.png)

This repo catalogs the agent skills, plugins, and utilities I use nearly every day across writing, code, research, design, and decision making.

Some are standalone skills. Some are plugin wrappers or MCP tools for Codex, Claude, Pi, OpenCode, OpenClaw, and other agent harnesses. Each has its own README with installation and usage notes.

## Skills Catalog

| Name | Use when | Install and Usage |
|---|---|---|
| <code>md&#8209;asks</code> | Resolve `@agent` asks in markdown files and record the exchange in callout threads. | <a href="skills/md-asks/SKILL.md">Markdown asks&nbsp;skill</a> |
| <code>obsidian&#8209;html&#8209;docs</code> | Author `.html` docs for the Obsidian HTML Docs plugin within its sandbox and asset constraints. | <a href="skills/obsidian-html-docs/SKILL.md">obsidian&#8209;html&#8209;docs&nbsp;skill</a> |
| <code>token&#8209;count</code> | Count tokens with Anthropic, Gemini, and OpenAI server-side endpoints for prompt budgeting. | <a href="skills/token-count/SKILL.md">token&#8209;count&nbsp;skill</a> |

## Install Skills

Install this skill collection with the standard skills CLI:

```bash
npx skills@latest add smcllns/skills
```

Standalone skills are the source of truth. Plugins and extensions copy those skills into platform-specific packages and add only the metadata or runtime wrapper they need.


## Plugins & Extensions

| Name | Use when | Install and Usage |
|---|---|---|
| <code>md&#8209;asks</code> | Resolve `@agent` asks in markdown files and record the exchange in callout threads. | <ul><li><a href="claude-plugins/md-asks/README.md">Claude</a></li><li><a href="codex-plugins/md-asks/README.md">Codex</a></li></ul> |
| <code>HTML&nbsp;Docs</code> | Render sandboxed `.html` notes inside Obsidian with local assets and app-style documents. | <a href="https://community.obsidian.md/plugins/html-docs">Obsidian&nbsp;plugin</a> |

## Install Plugins & Extensions

### Claude (Code, Cowork)

Add this repo as a Claude plugin marketplace:

```bash
claude plugin marketplace add smcllns/skills
```

Then install a plugin from inside Claude Code or Cowork:

```text
/plugin install md-asks@smcllns-skills
```

### Codex

Add this repo as a Codex plugin marketplace:

```bash
codex plugin marketplace add smcllns/skills
```

Then install `md-asks@smcllns-skills` from the Codex plugin picker.

### Pi, OpenCode, OpenClaw, Hermes, and others

Coming soon once we stabilize using it across Claude and Codex.

## Repo Organization

```text
@smcllns/skills (this repo)/
|-- .claude-plugin/marketplace.json    # Claude marketplace manifest
|-- .agents/plugins/marketplace.json   # Codex marketplace manifest
|-- skills/                            # Canonical portable skills
|-- claude-plugins/                    # Claude plugin packages
|-- codex-plugins/                     # Codex plugin packages
|-- docs/                              # Architecture notes, plans, handoffs
|-- scripts/                           # Repo maintenance helpers
`-- README.md
```

The bare skill in `skills/<name>/` is the source of truth. Plugin-embedded copies are derived so marketplace tarballs do not rely on symlinks. See [`docs/architecture.md`](docs/architecture.md) for the packaging model and sync expectations.

## Feedback

If a human reads every word that gets sent, issues, fixes, and usage notes are welcome at [github.com/smcllns/skills](https://github.com/smcllns/skills).

## License

MIT
