# Skills

A collection of my skills and plugins I use regularly and can be useful to others — across productivity, writing code, research, design, decision making, etc.

This repo serves as a **Claude plugin marketplace** ([docs](https://code.claude.com/docs/en/plugin-marketplaces)) in addition to hosting standalone skills under `skills/`.

## Plugins

| Plugin | Purpose |
| --- | --- |
| [`inbox-zero-gmail`](inbox-zero-gmail/) | Triage a Gmail inbox to zero per the user's policy — categorize, label, archive. Drafts replies on request; never sends or deletes. |

### Install as a marketplace

```bash
claude plugin marketplace add smcllns/skills
```

Then install a specific plugin from within Claude Code:

```
/plugin install inbox-zero-gmail@smcllns-skills
```

## Standalone skills

| Skill | Purpose |
| --- | --- |
| `markdown-agent-comments` | Resolves `@human`/`#claude`/`#codex` (etc) comments in any markdown file — Obsidian vaults, repo docs, plain notes — by making the requested edits and responding in place. |
| `obsidian-html-docs` | Helps agents author `.html` files for the HTML Docs Obsidian plugin, including sandbox limits, theme tokens, assets, and embeds. |
| `token-count` | Free, accurate token counts via Anthropic/Gemini/OpenAI server-side endpoints — for prompt budgeting, skill sizing, or annotating file references without local tokenizer deps. |

Install with the `skills.sh` CLI:

```bash
npx skills@latest add smcllns/skills
```

## License

MIT
