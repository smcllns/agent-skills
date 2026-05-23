# Skills

A collection of my skills and plugins I use regularly and can be useful to others — across productivity, writing code, research, design, decision making, etc.

This repo hosts standalone skills plus Claude and Codex plugin wrappers for the skills that benefit from host-specific packaging.

## Plugins

| Plugin | Hosts | Purpose |
| --- | --- | --- |
| `md-asks` | Claude, Codex | Picks up `@claude`/`@codex`/`@agent` asks in markdown files, does the requested work, and records the exchange in a callout that can be continued. |

### Claude marketplace

```bash
claude plugin marketplace add smcllns/skills
```

Then install a specific plugin from within Claude Code:

```
/plugin install <plugin-name>@smcllns-skills
```

### Codex marketplace

Codex plugin metadata lives in `.agents/plugins/marketplace.json`; plugin wrappers live under `codex-plugins/`.

## Standalone skills

| Skill | Purpose |
| --- | --- |
| `md-asks` | Picks up `@claude`/`@codex`/`@agent` asks in markdown files — Obsidian vaults, repo docs, plain notes — does the requested edit, and records the exchange in a callout that can be continued if follow-up is needed. |
| `obsidian-html-docs` | Helps agents author `.html` files for the HTML Docs Obsidian plugin, including sandbox limits, theme tokens, assets, and embeds. |
| `token-count` | Free, accurate token counts via Anthropic/Gemini/OpenAI server-side endpoints — for prompt budgeting, skill sizing, or annotating file references without local tokenizer deps. |

Install with the `skills.sh` CLI:

```bash
bunx skills@latest add smcllns/skills
```

## License

MIT
