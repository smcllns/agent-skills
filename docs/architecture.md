# Architecture notes — smcllns/skills

This repo serves three purposes from one source of truth:

1. **A registry of standalone skills** (under `skills/`) — installable via `bunx skills@latest add smcllns/skills` into any agent that loads `SKILL.md` from a directory.
2. **A Claude plugin marketplace** (under `claude-plugins/`, via root `.claude-plugin/marketplace.json`) — installable via `claude plugin marketplace add smcllns/skills` and through the Cowork UI.
3. **A Codex plugin marketplace** (under `codex-plugins/`, via root `.agents/plugins/marketplace.json`) — installable through Codex plugin flows.

## Layout

```
smcllns/skills/                        ← repo root
├── .claude-plugin/marketplace.json    ← marketplace manifest, lists Claude plugins
├── .agents/plugins/marketplace.json   ← marketplace manifest, lists Codex plugins
├── skills/                            ← bare skills (portable; `bunx skills add ...`)
│   ├── atag/
│   ├── obsidian-html-docs/
│   └── token-count/
├── claude-plugins/                    ← Claude plugins (work in Cowork + Code CLI)
│   └── atag/                          ← per-plugin dir; contains its own skills/, hooks/, etc.
├── codex-plugins/                     ← Codex plugins
│   └── atag/                          ← per-plugin dir; contains .codex-plugin/, skills/, etc.
├── docs/                              ← plans, notes
├── .gitignore
├── LICENSE
└── README.md
```

## Skills vs plugins

A **skill** is a directory containing `SKILL.md` and optionally `references/`, `tests/`, etc. The agent reads SKILL.md to know what to do. Skills are portable across hosts that follow the convention.

A **plugin** wraps a skill (or several) with host-specific machinery: `.claude-plugin/plugin.json` for Claude, `.codex-plugin/plugin.json` for Codex, plus optional hooks, commands, MCP/app config, or setup files. The skill is included as `skills/<skill-name>/SKILL.md` inside the plugin tree.

A given skill can ship in three forms:

| Form | Where it lives | Who installs it how |
|---|---|---|
| Bare skill | `skills/<name>/` | `bunx skills@latest add smcllns/skills` |
| Claude plugin | `claude-plugins/<name>/` | `claude plugin marketplace add smcllns/skills`; or Cowork UI |
| Codex plugin | `codex-plugins/<name>/` | Codex plugin marketplace entry in `.agents/plugins/marketplace.json` |

> **Source-of-truth.** The bare skill in `skills/<name>/` is canonical. Plugin-embedded copies at `<host>-plugins/<name>/skills/<name>/` are derived. Run `scripts/sync-skills.sh` to refresh the derived copies from the canonical source. CI verifies no drift on PRs.
>
> **No symlinks** — marketplace tarballs and some installers strip or choke on symlinks. Real files copy cleanly across all hosts.

## Plugin naming

Plugins inside `claude-plugins/` and `codex-plugins/` use the bare skill name — no host suffix. The parent dir already encodes the host, so suffixes are redundant. The `inbox-zero-gmail-claude` directory on the `inbox-zero` branch is the older naming and will be renamed to `inbox-zero-gmail` when that branch ships.

## Persistence

Plugins that need durable state use the Claude plugin runtime's persistent data directory (`${CLAUDE_PLUGIN_DATA}`, resolving under `~/.claude/plugins/data/<plugin-key>/` for the Claude Code CLI; Cowork uses its own equivalent). The plugin tree itself ships only example/template files. No user state files in the repo.

A SessionStart hook can seed defaults from an example into `${CLAUDE_PLUGIN_DATA}/` on first run.

Reference: <https://code.claude.com/docs/en/plugins-reference#persistent-data-directory>

## Cross-host strategy (deferred)

The Claude plugin spec is shared by Cowork and Claude Code CLI — one plugin works in both. Codex has its own plugin manifest and marketplace metadata, so Codex wrappers live in `codex-plugins/`. Obsidian plugins live in their own separate repos.

Don't pre-build cross-host machinery (shared SKILL.md sources, generated wrappers, etc.) until we have at least two hosts shipping the same skill and can see what actually differs.

## Related docs

- `docs/writing-claude-plugins.md` — accumulated how-to knowledge for authoring plugins (gotchas, schema, hooks, persistence, install/uninstall). Grows as we ship.
- The repository history captures the decision trail for the single-repo layout; this file documents the current architecture.
