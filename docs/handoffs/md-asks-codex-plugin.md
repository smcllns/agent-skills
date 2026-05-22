# Handoff: md-asks Codex plugin

Branch: `codex/md-asks-codex-plugin`

## What changed

- Renamed the Claude plugin root from `claude-cowork-plugins/` to `claude-plugins/`.
- Fixed `md-asks` scan tests to use the current `@agent` / `@claude` / `@codex` protocol.
- Added a Codex plugin wrapper at `codex-plugins/md-asks/`.
- Added Codex marketplace metadata at `.agents/plugins/marketplace.json`.
- Updated README and architecture docs to describe bare skill, Claude plugin, and Codex plugin forms.

## Shape

```text
skills/md-asks/                  canonical skill
claude-plugins/md-asks/          derived Claude plugin copy
codex-plugins/md-asks/           derived Codex plugin copy + .codex-plugin manifest
```

`scripts/sync-skills.sh` copies `skills/<name>/` into any matching plugin under `claude-plugins/` or `codex-plugins/`.

## Verification to keep green

- `bun test skills/md-asks/reference/markdown-agent-directives.spec.test.ts`
- `scripts/sync-skills.sh`
- `git diff --exit-code`
- JSON parse `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, and `codex-plugins/md-asks/.codex-plugin/plugin.json`

## Gotchas

- `.agents/` is ignored by Sam's global gitignore, so use `git add -f` for `.agents/plugins/marketplace.json` and `.agents/plans/...`.
- No hooks, MCP, app config, auth, or scheduler are needed for this plugin.
- The Codex marketplace uses this repo's host-specific path, `./codex-plugins/md-asks`, instead of the generic scaffold default `./plugins/md-asks`.
