# Architecture notes — smcllns/skills

This repo serves two purposes from one source of truth:

1. **A registry of standalone skills** (under `skills/`) — installable via `npx skills@latest add smcllns/skills` into any agent that loads `SKILL.md` from a directory.
2. **A Claude plugin marketplace** (under `claude-plugins/`, via root `.claude-plugin/marketplace.json`) — installable via `claude plugin marketplace add smcllns/skills` and through the Cowork UI.

A `codex-plugins/` sibling is reserved for future Codex wrappers of the same underlying skills.

## Layout

```
smcllns/skills/                        ← repo root
├── .claude-plugin/marketplace.json    ← marketplace manifest, lists Claude plugins
├── skills/                            ← bare skills (portable; `npx skills add ...`)
│   ├── markdown-agent-directives/
│   ├── obsidian-html-docs/
│   └── token-count/
├── claude-plugins/                    ← Claude plugins (work in Cowork + Code CLI)
│   └── md-asks/                       ← per-plugin dir; contains its own skills/, hooks/, etc.
├── codex-plugins/                     ← Codex plugins (format TBD, empty for now)
├── docs/                              ← plans, notes
├── .gitignore
├── LICENSE
└── README.md
```

## Skills vs plugins

A **skill** is a directory containing `SKILL.md` and optionally `references/`, `tests/`, etc. The agent reads SKILL.md to know what to do. Skills are portable across hosts that follow the convention.

A **plugin** wraps a skill (or several) with host-specific machinery: `.claude-plugin/plugin.json`, optional `hooks/`, optional `commands/`, optional setup. The skill is included as `skills/<skill-name>/SKILL.md` inside the plugin tree per the Claude plugin spec.

A given skill can ship in three forms:

| Form | Where it lives | Who installs it how |
|---|---|---|
| Bare skill | `skills/<name>/` | `npx skills@latest add smcllns/skills` |
| Claude plugin | `claude-plugins/<name>/` | `claude plugin marketplace add smcllns/skills`; or Cowork UI |
| Codex plugin | `codex-plugins/<name>/` (future) | TBD |

> **Source-of-truth.** The bare skill in `skills/<name>/` is canonical. Plugin-embedded copies at `<host>-plugins/<name>/skills/<name>/` are derived. Run `scripts/sync-skills.sh` to refresh the derived copies from the canonical source. CI verifies no drift on PRs.
>
> **No symlinks** — marketplace tarballs, `npm pack`, and some installers strip or choke on symlinks. Real files copy cleanly across all hosts.

## Plugin naming

Plugins inside `claude-plugins/` use the bare skill name — no `-claude` suffix. The parent dir already encodes the host, so the suffix was redundant. The `inbox-zero-gmail-claude` directory on the `inbox-zero` branch is the older naming and will be renamed to `inbox-zero-gmail` when that branch ships.

## Persistence

Plugins that need durable state use the Claude plugin runtime's persistent data directory (`${CLAUDE_PLUGIN_DATA}`, resolving under `~/.claude/plugins/data/<plugin-key>/` for the Claude Code CLI; Cowork uses its own equivalent). The plugin tree itself ships only example/template files. No user state files in the repo.

A SessionStart hook can seed defaults from an example into `${CLAUDE_PLUGIN_DATA}/` on first run.

Reference: <https://code.claude.com/docs/en/plugins-reference#persistent-data-directory>

## Cross-host strategy (deferred)

The Claude plugin spec is shared by Cowork and Claude Code CLI — one plugin works in both. Codex (OpenAI) is a different runtime and won't be a "plugin" in the same sense; it'll have its own dir layout in `codex-plugins/`. Obsidian plugins live in their own separate repos.

Don't pre-build cross-host machinery (shared SKILL.md sources, generated wrappers, etc.) until we have at least two hosts shipping the same skill and can see what actually differs.

## Related docs

- `docs/writing-claude-plugins.md` — accumulated how-to knowledge for authoring plugins (gotchas, schema, hooks, persistence, install/uninstall). Grows as we ship.
- `~/Projects/obsidian/scratch/Figured out single repo architecture for public skills and plugins - v3.md` — decision history (Sam's Obsidian vault). The *why* behind the current shape; this file documents the *what*.
- `docs/plans/2026-05-19-markdown-agent-directives-plugin.md` — current plan (was originally `markdown-agent-comments`; renamed after narrowing scope to directives only)
