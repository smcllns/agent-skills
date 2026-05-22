# Writing Claude plugins — what we've learned

Accumulated knowledge about authoring Claude plugins that work in both Cowork and Claude Code CLI. Grows as we ship. Companion to `architecture.md` (which covers what this repo is); this file covers how to make plugins inside it work.

> [!WARNING] **This doc was written from memory at the end of a single session — assume some details are wrong.**
>
> The author (Claude) did not re-read the official docs while writing this. Claims are based on what was observed in passing during the work (Codiff inspections, file dumps, one subagent's review of the marketplace schema). The runtime is also moving, so even correct claims will rot.
>
> **Source-of-truth links** — check these before trusting anything below, and update this doc when you find conflicts:
>
> - Plugin reference: <https://code.claude.com/docs/en/plugins-reference>
> - Plugin marketplaces: <https://code.claude.com/docs/en/plugin-marketplaces>
> - Persistent data directory: <https://code.claude.com/docs/en/plugins-reference#persistent-data-directory>
> - Symlinks within a marketplace: <https://code.claude.com/docs/en/plugins-reference#share-files-within-a-marketplace-with-symlinks>
> - Vercel skills CLI (for the `npx skills add` install path): <https://github.com/vercel-labs/skills>
>
> **Encouraged workflow:** as you verify a claim here, append a note in the *Verified findings* section at the bottom (e.g. "marketplace.json `skills` field — confirmed against docs 2026-05-22, behaves as documented"). When you find a claim is wrong, correct it inline and note the correction at the bottom.

## The format is shared

Claude Cowork and Claude Code CLI use the **same plugin spec**. One `.claude-plugin/plugin.json`, one set of skills, one set of hooks — works in both hosts unmodified. Don't write Cowork-specific variants of the manifest; there is no Cowork-only field.

Codex is a different runtime and won't be a "plugin" in this sense. Its wrapper goes in `codex-plugins/` and will have a different file layout.

## File layout — use the auto-discovery default

The plugin runtime auto-discovers skills at `<plugin-root>/skills/<skill-name>/SKILL.md`. If you put skills there, you don't need to declare them anywhere.

```
my-plugin/
├── .claude-plugin/plugin.json        ← required, exact path
├── skills/<skill-name>/SKILL.md      ← auto-discovered
├── hooks/hooks.json                  ← optional
├── commands/                         ← optional (slash commands)
└── README.md
```

**Gotcha — `.claude-plugin/` is not a renameable namespace.** Both Cowork and CLI hardcode-look for `.claude-plugin/plugin.json`. You cannot rename it to `.claude-cowork/` or similar; the plugin will not be discovered.

## marketplace.json

Repo-root file at `.claude-plugin/marketplace.json` declares the marketplace and lists its plugins.

```json
{
  "name": "smcllns-skills",
  "version": "0.1.0",
  "description": "...",
  "owner": { "name": "Sam Collins", "email": "..." },
  "plugins": [
    {
      "name": "inbox-zero-gmail-claude",
      "source": "./claude-plugins/inbox-zero-gmail-claude",
      "description": "...",
      "category": "productivity"
    }
  ]
}
```

**Gotcha — the optional `skills` field on a plugin entry expects a parent dir, not the skill dir.** The docs say "Custom skill directories containing `<name>/SKILL.md`". The value must be a parent dir whose children are `<name>/SKILL.md`. If you use the default `skills/` layout (recommended), **omit the field entirely** — the runtime finds skills automatically. Pointing it at the skill dir itself yields zero discovery, silently.

**`version` on the marketplace** is the manifest's own version, distinct from per-plugin versions. Bump when the marketplace schema changes or the plugin list changes.

## plugin.json

```json
{
  "name": "inbox-zero-gmail-claude",
  "description": "...",
  "author": { "name": "Sam Collins" },
  "keywords": ["email", "gmail", "triage", "productivity"]
}
```

Only `name` is required.

**Version strategy:** during private iteration, **omit `version` entirely**. The plugin runtime falls back to commit SHA, so every push updates installed plugins without manual bumps. When the plugin goes public, add `"version": "0.1.0"` and bump on each release.

## Hooks (`hooks/hooks.json`)

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "..." }
        ]
      }
    ]
  }
}
```

Available env vars inside the command:

- `${CLAUDE_PLUGIN_ROOT}` — the installed plugin's root directory (read-only)
- `${CLAUDE_PLUGIN_DATA}` — the plugin's persistent data dir (writable, persists across sessions)

**Gotcha — shell precedence in compound commands.** `mkdir -p X && [ -f Y ] || cp ...` parses as `(mkdir && test) || cp`. If `mkdir` fails, `cp` still runs (and also fails). For first-run seed-once patterns, wrap explicitly:

```sh
mkdir -p "${CLAUDE_PLUGIN_DATA}" && { [ -f "${CLAUDE_PLUGIN_DATA}/policy.md" ] || cp "${CLAUDE_PLUGIN_ROOT}/skills/foo/references/policy.example.md" "${CLAUDE_PLUGIN_DATA}/policy.md"; }
```

## Persistence — `${CLAUDE_PLUGIN_DATA}`

Reference: <https://code.claude.com/docs/en/plugins-reference#persistent-data-directory>

Each installed plugin gets a private directory the runtime resolves to `${CLAUDE_PLUGIN_DATA}`. For Claude Code CLI it's under `~/.claude/plugins/data/<plugin-key>/`; Cowork uses its own location.

- The plugin tree ships only example/template files (e.g. `policy.example.md`).
- Runtime state files (`policy.md`, `log.jsonl`, etc.) live in `${CLAUDE_PLUGIN_DATA}` and persist across sessions.
- Use a SessionStart hook to seed defaults from the example on first run (see above).

**Do not write user state files into the plugin tree.** They'd get overwritten on every plugin update.

## Installing for local testing

### Claude Code CLI

```sh
# From the repo containing the marketplace
claude plugin marketplace add ~/Projects/skills        # adds the marketplace from a local path
/plugin install <plugin-name>@smcllns-skills           # inside Claude Code
```

State lives at:
- `~/.claude/plugins/installed_plugins.json` — installed plugins
- `~/.claude/plugins/known_marketplaces.json` — known marketplaces
- `~/.claude/plugins/marketplaces/<marketplace-name>/` — marketplace cache
- `~/.claude/plugins/cache/<marketplace-name>/<plugin>/` — plugin cache

### Cowork

Install via the in-app UI: **Directory → Plugins → Personal → Local uploads → `+`**. **Upload a zip of the plugin directory** — Cowork rejects a raw folder pick. Zip the plugin dir (the one containing `.claude-plugin/plugin.json`), not the whole marketplace:

```bash
cd claude-plugins && zip -r /tmp/<plugin-name>.zip <plugin-name> -x '*.DS_Store'
```

Then upload `/tmp/<plugin-name>.zip` via the UI. The zip is a frozen snapshot — re-zip and re-upload after each change you want Cowork to see. There is no local-path CLI flow in Cowork as of this writing.

Cowork's installed-plugin state lives at `~/Library/Application Support/Claude/local-agent-mode-sessions/<UUID>/<UUID>/rpm/manifest.json`, with each plugin in a sibling `plugin_<id>/` directory. **Do not edit this by hand.**

## Uninstalling

Always uninstall via the host's UI, not by deleting files on disk. The hosts maintain authoritative indexes (`manifest.json`, `installed_plugins.json`) — removing a plugin directory directly leaves dangling references and unpredictable behavior, especially with Cowork running.

## Cowork-specific behavior

- Cowork plugins live alongside session state under `local-agent-mode-sessions/`. Treat the entire tree as Cowork-managed.
- Cowork is Electron — quitting the last window does not always quit the process. Multiple zombie main processes can accumulate from repeated launches. Use `pgrep -lf '/Applications/Cowork.app/Contents/MacOS/'` to check (replace Cowork with the actual app name).
- The Gmail connector exposes tools as `mcp__<connector-id>__<name>`. Inside `search_threads`, `label:` queries use display names; mutation tools use label IDs. See `claude-plugins/inbox-zero-gmail-claude/skills/inbox-zero-gmail/references/transport-cowork.md` for the catalog of Gmail tool gotchas.
- Cowork supports scheduled tasks via the built-in scheduling skill: `mcp__scheduled-tasks__create_scheduled_task`. Scheduled tasks run only while the computer is awake AND Cowork is open; otherwise they're skipped (not queued) until the next wake.
- **Schedule minimum is 1 minute on Desktop**, not hourly as the UI dropdown implies. The dropdown only exposes presets (Manual, Hourly, Daily, Weekdays, Weekly). To get sub-hourly intervals, ask Claude in any Desktop session in plain language — e.g. *"schedule a task to run every 5 minutes that runs the X skill on Y"* — and Claude creates it via the MCP tool with the custom interval. Cloud Routines (the off-machine alternative) has a hard 1-hour minimum. Source: <https://code.claude.com/docs/en/desktop-scheduled-tasks>.

## Symlinks (we chose not to)

The plugin spec supports symlinks within a marketplace — at install time they're dereferenced into the plugin cache. Reference: <https://code.claude.com/docs/en/plugins-reference#share-files-within-a-marketplace-with-symlinks>.

We decided **not** to use symlinks (decision in `~/Projects/obsidian/scratch/Figured out single repo architecture for public skills and plugins - v3.md`). They complicated the layout (cycle-avoidance, individual-child symlinks vs directory symlinks), made the diff confusing in Codiff, and the DRY benefit didn't pay rent at one plugin. If you find yourself wanting them later, the spec supports it — just confirm the dereferenced output looks right in the install cache.

## Things we haven't verified

Flagging gaps honestly so the next agent doesn't take this as gospel:

- [ ] **End-to-end install via the marketplace path.** We've drafted plugins but not yet run `claude plugin marketplace add smcllns/skills` against a published repo.
- [ ] **SessionStart hook in a real run.** We dry-ran the command in a sandbox; haven't observed Cowork firing it.
- [x] **Cowork UI install of a local folder.** Verified 2026-05-21 with `markdown-agent-directives`: Cowork requires a **zip of the plugin dir**, not a folder pick. See *Verified findings* below for the exact flow.
- [ ] **Scheduled invocation through `mcp__scheduled-tasks__create_scheduled_task`.** Listed as a goal in the markdown-agent-directives plan; will verify there.
- [ ] **Whether `npx skills@latest add smcllns/skills` finds the bare skills under `skills/`.** The vercel-labs/skills CLI may or may not scan the standard `skills/` subdir. Check before committing.
- [ ] **marketplace.json schema validation.** We've parsed it as JSON but haven't validated against the actual runtime schema.

When you verify any of these, **tick the box and write what you found** below. This is a growing doc.

## Verified findings

- **Cowork local-plugin install requires a zip, not a folder** (verified 2026-05-21, `markdown-agent-directives`). UI path: **Directory → Plugins → Personal → Local uploads → `+`**. Picking a folder is rejected; you must upload a zip whose top-level entry is the plugin directory (the one with `.claude-plugin/plugin.json`). The zip is a frozen snapshot — Cowork does not re-read source files, so re-zip and re-upload on every change you want it to see. Implication: this is a slow inner loop; iterate on the bare skill at `skills/<name>/` and only re-zip when you're ready to verify in Cowork.
