# atag watcher plan

## Goal

Add a standalone `atag` watcher that checks markdown files cheaply and only invokes Claude when unresolved tags exist.

## Research findings

- Current source of truth is `skills/atag/SKILL.md`.
- Existing scan is two-pass:
  - `grep -rlnE --include='*.md' ...` for inline tags and `[!NOTE]+`.
  - `find ... -exec awk ...` for unsealed `[!DONE]-` follow-ups.
- Default triggers are `agent claude codex`.
- Custom triggers replace the default alternation in the documented scan.
- `/skill:atag` and `/skill atag` are not valid Claude Code commands on this machine.
- `/atag` is not currently available because the local Claude plugin is not installed; `--plugin-dir claude-plugins/atag` reaches Claude execution, so loading/installing the plugin is part of local setup.
- Existing model-comparison harness invokes Claude with prose: `claude -p "Run the atag skill ..."` rather than a slash command.
- Canonical skill files live in `skills/atag/`; plugin copies are derived by `scripts/sync-skills.sh`.

## Missing requirements to settle

- Custom triggers: confirm "provided triggers replace defaults" rather than "extend defaults". Recommendation: replace, matching `SKILL.md`.
- Runtime mode: confirm default behavior. Recommendation: one-shot by default, with `--watch --interval 60` for long-running local use. That keeps launchd/cron/test usage deterministic.
- Claude permissions: unattended runs need a non-interactive edit mode. Recommendation: support `--claude-arg ...` / `ATAG_CLAUDE_ARGS`, and local setup can use `--permission-mode acceptEdits` if Sam wants unattended edits.
- Claude model/budget: decide whether watcher should pass a default model or leave Claude defaults alone. Recommendation: leave defaults alone, allow `ATAG_CLAUDE_ARGS`.
- Scan exclusions: decide exact documented scan vs skipping common heavy dirs like `.git` or `node_modules`. Recommendation: exact documented scan first; only add excludes after evidence.
- Concurrency: if a run takes over a minute, avoid overlapping Claude processes. Recommendation: per-dir lock with stale-PID cleanup.

## Implementation plan

- [ ] Add `skills/atag/scripts/atag-watch.sh`.
  - Bash, no new dependencies.
  - Args: `--dir DIR`, `--debug`, `--watch`, `--interval SECONDS`, `--once`, `--claude-arg ARG`, optional trigger list.
  - Accept triggers like `@pi`, `@agento,@pi`, `@agento, @pi`.
  - Reject whitespace-only trigger lists like `@agento @pi`.
  - Default dir: current working directory.
  - Default triggers: `agent claude codex`.
  - No match: exit 0 with no stdout.
  - Match: `cd` to target dir, invoke Claude, pass through Claude stdout/stderr and exit code.
  - Debug: write scan path, triggers, matched files, and Claude command to stderr.
  - Lock: skip or debug-report if another watcher run is active for the same dir.
- [ ] Add `skills/atag/reference/atag-watch.test.ts`.
  - Use temp fixtures and a stub `claude` on `PATH`.
  - Test no-match quiet behavior.
  - Test default trigger match invokes Claude once.
  - Test custom trigger parsing accepted/rejected cases.
  - Test `--dir` changes cwd for Claude.
  - Test unsealed `[!DONE]-` match invokes Claude.
  - Test debug output goes to stderr.
  - Test Claude failure propagates.
- [ ] Update `skills/atag/SKILL.md`.
  - Add a short "Watcher script" section.
  - Keep the existing scan commands as source of truth.
  - Mention no-token gate, quiet default, debug mode, and local scheduling.
- [ ] Update `claude-plugins/atag/README.md`.
  - Add local technical-user setup.
  - Include marketplace install command and watcher example.
- [ ] Run verification.
  - `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts`
  - `bun test skills/atag/reference/atag-watch.test.ts`
  - `scripts/sync-skills.sh`
  - `diff -qr skills/atag claude-plugins/atag/skills/atag`
  - `diff -qr skills/atag codex-plugins/atag/skills/atag`
  - `git diff --check`
- [ ] Local machine setup.
  - Install or load the Claude atag plugin.
  - Smoke test on a temp folder with `@codex`.
  - Smoke test quiet no-op on a temp folder with no tags.
  - Start long-running watcher or create a launchd job after the one-shot script is proven.

## Open questions

- Should provided custom triggers replace defaults, or add to `agent claude codex`?
- Should the script default to one-shot or an every-minute loop?
- What Claude args should the local unattended run use: default, `--permission-mode acceptEdits`, model, max budget?
- Should the first version scan exactly like `SKILL.md`, or skip heavy dirs?
