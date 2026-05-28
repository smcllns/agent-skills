# atag check/sweep plan

## Goal

Ship one co-designed Markdown Agent Tags skill + CLI + plugin-command pattern.

## Product surfaces

- Native CLI: `atag check`, `atag sweep`
- Claude plugin commands: `/agent-tags:check`, `/agent-tags:sweep`
- Codex plugin surface: ergonomic skill/action entries for check and sweep. Current local Codex plugin docs do not expose Claude-style `commands/`, so do not assume namespaced slash commands unless newer evidence proves support.
- Canonical implementation: bundled CLI under `skills/atag/scripts/`.

## Decisions

- `SKILL.md` stays high-level: purpose, strategy, outcome contract, when to check vs sweep.
- CLI owns mechanics: parsing, flags, deterministic rewrites, help text, agent-runner passthrough.
- Plugin commands are ergonomic entry points over the CLI, not separate implementations.
- Default `check` behavior: find actionable tags and invoke the agent once.
- `check --list`: scan only, no agent invocation.
- `check --watch`: foreground polling loop.
- Default `sweep` behavior: `--resolved --trace`.
- `sweep --all`: includes active `[!NOTE]+` and unsealed `[!DONE]-`; explicit because it can remove live work.
- `sweep --trace`: replace archived callout with a markdown footnote reference.
- `sweep --t0`: remove in-context callout and append archive entry at bottom; no visible in-context marker.
- Add `--dry-run` for sweep preview.

## Implementation tasks

- [x] Confirm Codex plugin command support or choose skill/action fallback.
- [ ] Add `skills/atag/scripts/atag`.
  - [ ] `atag check --dir DIR [--list] [--once] [--watch] [triggers...] -- [agent args...]`
  - [ ] `atag sweep [paths...] [--resolved|--all] [--trace|--t0] [--dry-run]`
- [ ] Add shared parser/rewriter tests under `skills/atag/reference/`.
- [ ] Add Claude commands:
  - [ ] `claude-plugins/atag/commands/agent-tags/check.md`
  - [ ] `claude-plugins/atag/commands/agent-tags/sweep.md`
- [ ] Add Codex command/skill surface using the verified supported mechanism.
- [ ] Rewrite `skills/atag/SKILL.md` to reference CLI commands instead of embedding long shell snippets.
- [ ] Update plugin READMEs with entry-point examples.
- [ ] Run `scripts/sync-skills.sh`.

## Verification

- [ ] `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts`
- [ ] New `check` CLI fixture tests.
- [ ] New `sweep` CLI fixture tests.
- [ ] Manual scratch-doc smoke:
  - [ ] `atag check --list --dir <tmp>`
  - [ ] `atag sweep <tmp/doc.md> --resolved --trace`
  - [ ] `atag sweep <tmp/doc.md> --all --t0 --dry-run`
- [ ] Claude command smoke: `/agent-tags:check` and `/agent-tags:sweep` resolve in a plugin-loaded Claude session.
- [ ] Codex surface smoke using the verified supported entry point.
- [ ] `diff -qr skills/atag claude-plugins/atag/skills/atag`
- [ ] `diff -qr skills/atag codex-plugins/atag/skills/atag`
- [ ] `git diff --check`

## Plan review

- [x] Review for ambiguity before implementation.
  - Codex command namespacing is the main ambiguity. Local `.codex-plugin/plugin.json` docs list skills, hooks, MCP servers, apps, and `interface.defaultPrompt`, but no command-file surface. Treat Codex as a skill/action UX unless implementation finds contrary current evidence.
  - `sweep --t0` archive format needs one product decision before code.
  - The rest of the behavior is specific enough to implement against fixtures.
- [x] Review for over-engineering before implementation.
  - Keep one CLI implementation; no separate Claude/Codex parsers.
  - No new package/dependency unless a standard markdown parser is already present, which it is not.
  - No config file, daemon, persistent state, or install manager in this PR.
  - Do not build a general markdown-footnote engine; only rewrite Markdown Agent Tags callouts.

## Open questions

- Should `sweep --t0` archive entry use unreferenced markdown footnote definitions or a normal `## Agent Tags Archive` appendix? Unreferenced footnotes are less portable.
