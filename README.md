# Skills

A collection of my skills and plugins I use regularly and can be useful to others — across productivity, writing code, research, design, decision making, etc.

This repo serves as a **Claude plugin marketplace** ([docs](https://code.claude.com/docs/en/plugin-marketplaces)) in addition to hosting standalone skills under `skills/`.

## Plugins

_None published yet — first plugin (`markdown-agent-directives`) in progress._

### Install as a marketplace

```bash
claude plugin marketplace add smcllns/skills
```

Then install a specific plugin from within Claude Code:

```
/plugin install <plugin-name>@smcllns-skills
```

## Standalone skills

| Skill | Purpose |
| --- | --- |
| `markdown-agent-directives` | Picks up `#claude`/`#codex`/`#agent` directives in any markdown file — Obsidian vaults, repo docs, plain notes — does the requested edit, and records the exchange in a callout that can be continued if follow-up is needed. |
| `obsidian-html-docs` | Helps agents author `.html` files for the HTML Docs Obsidian plugin, including sandbox limits, theme tokens, assets, and embeds. |
| `token-count` | Free, accurate token counts via Anthropic/Gemini/OpenAI server-side endpoints — for prompt budgeting, skill sizing, or annotating file references without local tokenizer deps. |

Install with the `skills.sh` CLI:

```bash
npx skills@latest add smcllns/skills
```

## License

MIT
