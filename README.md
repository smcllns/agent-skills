# Sam Collins Skills

A collection of my skills and plugins I use regularly and can be useful to others — across productivity, writing code, research, design, decision making, etc.

This repo has standalone skills plus plugins and extensions for agent platforms and harnesses. The main README is the quick map; each skill or plugin README has the detailed usage notes.

## Install Skills

Install this skill collection with the standard skills CLI:

```bash
npx skills@latest add smcllns/skills
```

Standalone skills are the source of truth. Plugins and extensions copy those skills into platform-specific packages and add only the metadata or runtime wrapper they need.

## Skills Catalog

| Name | Use when | Read more |
|---|---|---|
| `md-asks` | Resolve `@agent` asks and open `[!NOTE]+` discussion threads in markdown files. | [`skills/md-asks/SKILL.md`](skills/md-asks/SKILL.md) |
| `obsidian-html-docs` | Author `.html` docs for the Obsidian HTML Docs plugin within its sandbox and asset constraints. | [`skills/obsidian-html-docs/SKILL.md`](skills/obsidian-html-docs/SKILL.md) |
| `token-count` | Count tokens with Anthropic, Gemini, and OpenAI server-side endpoints for prompt budgeting. | [`skills/token-count/SKILL.md`](skills/token-count/SKILL.md) |

## Plugins & Extensions (Codex, Claude, Cowork, Pi)

| Name | Use when | Read more |
|---|---|---|
| `md-asks` | Resolve `@claude`, `@codex`, or `@agent` asks in markdown files and record the exchange in a callout thread. | [`claude-plugins/md-asks/README.md`](claude-plugins/md-asks/README.md), [`codex-plugins/md-asks/README.md`](codex-plugins/md-asks/README.md) |

## Install Plugins & Extensions

### Claude Code / Cowork

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

### Pi

No Pi extension is packaged yet.

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

Issues, fixes, and usage notes are welcome at [github.com/smcllns/skills](https://github.com/smcllns/skills).

## License

MIT
