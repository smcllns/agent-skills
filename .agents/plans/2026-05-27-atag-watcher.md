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
- Concurrency: if a run takes over a minute, avoid overlapping Claude processes. Need pick between scheduler-level serialization and script-level lock.

## Resolved decisions from 2026-05-27 discussion

- Runtime model: one-shot script only. External scheduler runs it every minute. Do not add an internal `--watch` loop.
- Claude invocation: invoke the installed skill, not the plugin. Local verification passed after copying `atag` into `/Users/smcllns/Projects/dotfiles/skills/atag`.
- Claude defaults: use `--permission-mode acceptEdits`, latest Sonnet alias, no default budget.
- Claude passthrough: support normal Claude CLI args so callers can override model, budget, permission mode, max turns, etc.
- Runaway guard: set a default max-turns cap if Claude CLI exposes a suitable flag; otherwise add a timeout wrapper around the Claude subprocess.
- Scan scope: do not skip directories. Use the documented recursive scan exactly.
- Dev test folder: `/Users/smcllns/Projects/skills/skills/atag/dev`.

## Implementation plan

- [ ] Add `skills/atag/scripts/atag-watch.sh`.
  - Bash, no new dependencies.
  - Args: `--dir DIR`, `--debug`, `--claude-arg ARG`, optional trigger list.
  - Accept triggers like `@pi`, `@agento,@pi`, `@agento, @pi`.
  - Reject whitespace-only trigger lists like `@agento @pi`.
  - Default dir: current working directory.
  - Default triggers: `agent claude codex`.
  - No match: exit 0 with no stdout.
  - Match: `cd` to target dir, invoke Claude, pass through Claude stdout/stderr and exit code.
  - Claude command defaults: `claude -p --model sonnet --permission-mode acceptEdits`.
  - Debug: write scan path, triggers, matched files, and Claude command to stderr.
  - Overlap protection: implement the option selected after the concurrency discussion.
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
  - Copy or install the `atag` skill into Claude Code's effective skill directory.
  - Smoke test on a temp folder with `@codex`.
  - Smoke test quiet no-op on a temp folder with no tags.
  - Create a launchd job or other external scheduler after the one-shot script is proven.

## Open questions

- Should provided custom triggers replace defaults, or add to `agent claude codex`?
- Which overlap protection should we choose?
