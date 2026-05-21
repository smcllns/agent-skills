# Architecture notes — smcllns/skills

This repo serves two purposes from one source of truth:

1. **A registry of standalone skills** (under `skills/`) — installable via `npx skills@latest add smcllns/skills` into any agent that loads `SKILL.md` from a directory.
2. **A Claude plugin marketplace** (under `claude-cowork-plugins/`, via root `.claude-plugin/marketplace.json`) — installable via `claude plugin marketplace add smcllns/skills` and through the Cowork UI.

A `codex-plugins/` sibling is reserved for future Codex wrappers of the same underlying skills.

## Layout

```
smcllns/skills/                        ← repo root
├── .claude-plugin/marketplace.json    ← marketplace manifest, lists Claude plugins
├── skills/                            ← bare skills (portable; `npx skills add ...`)
│   ├── markdown-agent-comments/
│   ├── obsidian-html-docs/
│   └── token-count/
├── claude-cowork-plugins/             ← Claude plugins (work in Cowork + Code CLI)
│   └── inbox-zero-gmail-claude/       ← per-plugin dir; contains its own skills/, hooks/, etc.
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
| Claude plugin | `claude-cowork-plugins/<name>/` | `claude plugin marketplace add smcllns/skills`; or Cowork UI |
| Codex plugin | `codex-plugins/<name>/` (future) | TBD |

> **Source-of-truth tension.** The bare skill in `skills/` and the plugin's embedded copy at `claude-cowork-plugins/<plugin>/skills/<skill>/` are two files of the same SKILL.md. **No symlinks** (decision, see scratch doc). For now we keep them in sync by hand. If drift becomes painful, we'll introduce a build step or one-direction copy at commit time. Don't pre-build either.

## Plugin naming

Plugins inside `claude-cowork-plugins/` are named `<skill>-claude` (e.g. `inbox-zero-gmail-claude`). The `-claude` suffix is currently redundant since the parent dir already encodes the host. Carryover from an earlier layout iteration. **Open question:** drop the suffix on next pass (`claude-cowork-plugins/inbox-zero-gmail/`) for cleaner naming.

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
- `docs/plans/2026-05-19-inbox-zero-gmail.md` — parked work
- `docs/plans/2026-05-19-markdown-agent-comments-plugin.md` — next up
