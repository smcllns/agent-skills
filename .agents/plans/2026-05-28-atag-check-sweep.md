# atag check/sweep plan

## Goal

Stage 1: ship Claude plugin commands for Markdown Agent Tags check/sweep.

Later stages: move mechanics into a native bundled `atag` CLI, then expose Codex ergonomic surfaces over the same implementation.

## Product surfaces

- Stage 1: Claude plugin command `/agent-tags` with `check` and `sweep` subcommands
- Stage 2: native CLI `atag check`, `atag sweep`
- Stage 3: Codex plugin surface using ergonomic skill/action entries. Current local Codex plugin docs do not expose Claude-style `commands/`, so do not assume namespaced slash commands unless newer evidence proves support.

## Decisions

- Final architecture: `SKILL.md` stays high-level; CLI owns mechanics; plugin commands are ergonomic entry points over the CLI.
- Stage 1 exception: Claude commands directly encode the simple command behavior until the CLI exists.
- Default Claude `check` behavior: find actionable tags and resolve them once.
- `check --list`: scan only, no agent invocation.
- `check --watch`: deferred to CLI stage.
- Default `sweep` behavior: `--resolved --trace`.
- `sweep --all`: includes active `[!NOTE]+` and unsealed `[!DONE]-`; explicit because it can remove live work.
- `sweep --trace`: replace archived callout with a markdown footnote reference.
- `sweep --t0`: remove in-context callout and append a normal `## Agent Tags Archive` appendix entry; no visible in-context marker.
- `sweep --dry-run`: preview without mutation.

## Implementation tasks

- [x] Confirm Codex plugin command support or choose skill/action fallback.
- [x] Resolve `--t0` archive format: normal appendix entry, not unreferenced footnote.
- [x] Stage 1: Add Claude command:
  - [x] `claude-plugins/atag/commands/agent-tags.md`
- [x] Stage 1: Update Claude plugin README with command examples.
- [ ] Stage 2: Add `skills/atag/scripts/atag`.
  - [ ] `atag check --dir DIR [--list] [--once] [--watch] [triggers...] -- [agent args...]`
  - [ ] `atag sweep [paths...] [--resolved|--all] [--trace|--t0] [--dry-run]`
- [ ] Stage 2: Add shared parser/rewriter tests under `skills/atag/reference/`.
- [ ] Stage 2: Rewrite `skills/atag/SKILL.md` to reference CLI commands instead of embedding long shell snippets.
- [ ] Stage 2: Run `scripts/sync-skills.sh`.
- [ ] Stage 3: Add Codex command/skill surface using the verified supported mechanism.

## Verification

- [x] Stage 1: Validate Claude command files match known command frontmatter shape.
- [x] Stage 1: Claude command smoke: `/agent-tags check` and `/agent-tags sweep` resolve in a plugin-loaded Claude session.
- [x] Stage 1: Critical review for over-engineering/gaps.
- [x] Stage 1: `git diff --check`
- [ ] Stage 2: `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts`
- [ ] Stage 2: New `check` CLI fixture tests.
- [ ] Stage 2: New `sweep` CLI fixture tests.
- [ ] Stage 2: Manual scratch-doc smoke:
  - [ ] `atag check --list --dir <tmp>`
  - [ ] `atag sweep <tmp/doc.md> --resolved --trace`
  - [ ] `atag sweep <tmp/doc.md> --all --t0 --dry-run`
- [ ] Stage 2: `diff -qr skills/atag claude-plugins/atag/skills/atag`
- [ ] Stage 2: `diff -qr skills/atag codex-plugins/atag/skills/atag`
- [ ] Stage 3: Codex surface smoke using the verified supported entry point.
- [ ] `git diff --check`

## Plan review

- [x] Review for ambiguity before implementation.
  - Codex command namespacing is the main ambiguity. Local `.codex-plugin/plugin.json` docs list skills, hooks, MCP servers, apps, and `interface.defaultPrompt`, but no command-file surface. Treat Codex as a skill/action UX unless implementation finds contrary current evidence.
  - `sweep --t0` archive format resolved to a normal appendix.
  - Stage 1 command behavior is specific enough to implement without building the CLI first.
- [x] Review for over-engineering before implementation.
  - Keep one CLI implementation; no separate Claude/Codex parsers.
  - No new package/dependency unless a standard markdown parser is already present, which it is not.
  - No config file, daemon, persistent state, or install manager in this PR.
  - Do not build a general markdown-footnote engine; only rewrite Markdown Agent Tags callouts.

## Open questions

- None for Stage 1.
