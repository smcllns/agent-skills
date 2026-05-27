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
- `/atag`, `/skill:atag`, and `/skill atag` are not Claude Code commands. Invoke the installed skill with prose via `claude -p`.
- Local natural-language skill invocation passed after copying `atag` into Claude Code's effective skills dir at `/Users/smcllns/Projects/dotfiles/skills/atag`.
- Existing model-comparison harness invokes Claude with prose: `claude -p "Run the atag skill ..."` rather than a slash command.
- Canonical skill files live in `skills/atag/`; plugin copies are derived by `scripts/sync-skills.sh`.

## Resolved decisions from 2026-05-27 discussion

- Runtime model: foreground terminal-bound polling loop. The script runs cheap scans every minute and blocks while `claude -p` runs.
- No launchd/cron for v1. Closing the terminal should kill the loop.
- No filesystem watcher. This is polling, not WatchPaths/fs-events.
- Concurrency: no per-dir lock in v1. A single foreground loop cannot overlap with itself because it waits for `claude -p` to exit before sleeping and scanning again.
- Claude invocation: invoke the installed skill, not the plugin. Local verification passed after copying `atag` into `/Users/smcllns/Projects/dotfiles/skills/atag`.
- Claude defaults: use `--permission-mode acceptEdits`, latest Sonnet alias, no default budget.
- Claude passthrough: support normal Claude CLI args so callers can override model, budget, permission mode, max turns, etc.
- Runaway guard: Claude CLI does not expose a max-turns flag; use a 30-minute timeout wrapper around the Claude subprocess.
- Scan scope: do not skip directories. Use the documented recursive scan exactly.
- Custom triggers replace defaults. Example: passing `@pi` scans only for `@pi`, not `agent claude codex pi`.
- Dev test folder: `/Users/smcllns/Projects/skills/skills/atag/dev`.
- `skills/atag/dev/` is local scratch and must not ship. It is gitignored and excluded by `scripts/sync-skills.sh`.

## Implementation plan

- [x] Add `skills/atag/scripts/atag-poll.sh`.
  - Bash, no new dependencies.
  - Default behavior: run a foreground polling loop every 60 seconds.
  - Args: `--dir DIR`, `--interval SECONDS`, `--once`, `--debug`, `--claude-arg ARG`, optional trigger list.
  - Accept triggers like `@pi`, `@agento,@pi`, `@agento, @pi`.
  - Reject whitespace-only trigger lists like `@agento @pi`.
  - Default dir: current working directory.
  - Default triggers: `agent claude codex`.
  - No match: print nothing and sleep until next interval; with `--debug`, print one status line to stderr.
  - Match: `cd` to target dir, invoke Claude, pass through Claude stdout/stderr, then sleep until next interval.
  - Claude command defaults: `claude -p --model sonnet --permission-mode acceptEdits`.
  - `--once`: perform one scan/invocation cycle, then exit with the scan/Claude result; used for tests and scheduler-agnostic future wrappers.
  - Debug: write scan path, triggers, matched files, and Claude command to stderr.
  - Signal handling: trap INT/TERM/HUP and exit cleanly so terminal close or Ctrl-C stops the loop.
- [x] Add `skills/atag/reference/atag-poll.test.ts`.
  - Use temp fixtures and a stub `claude` on `PATH`.
  - Test no-match quiet behavior.
  - Test default trigger match invokes Claude once.
  - Test custom trigger parsing accepted/rejected cases.
  - Test `--dir` changes cwd for Claude.
  - Test unsealed `[!DONE]-` match invokes Claude.
  - Test debug no-match output is a single status line on stderr.
  - Test Claude failure propagates.
- [x] Update `skills/atag/SKILL.md`.
  - Add a short "Watcher script" section.
  - Keep the existing scan commands as source of truth.
  - Mention no-token gate, quiet default, debug mode, and local scheduling.
- [x] Update `claude-plugins/atag/README.md`.
  - Add local technical-user setup.
  - Include marketplace install command and watcher example.
- [x] Run verification.
  - `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts`
  - `bun test skills/atag/reference/atag-poll.test.ts`
  - `scripts/sync-skills.sh`
  - `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag`
  - `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag`
  - `git diff --check`
- [x] Local machine setup.
  - Copy or install the `atag` skill into Claude Code's effective skill directory.
  - Smoke test on a temp folder with `@codex`.
  - Smoke test quiet no-op on a temp folder with no tags.
  - Run the foreground polling script against `/Users/smcllns/Projects/skills/skills/atag/dev`.

## Verification results

- `bash -n skills/atag/scripts/atag-poll.sh` passed.
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts claude-plugins/atag/skills/atag/reference/atag-poll.test.ts codex-plugins/atag/skills/atag/reference/atag-poll.test.ts` passed: 153 pass, 0 fail.
- `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag` passed.
- `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag` passed.
- `git diff --check` passed.
- Quiet no-op smoke passed against a temp folder.
- Live smoke passed against `skills/atag/dev`: poller found `fixture.md`, invoked `claude -p`, and Claude resolved four tags.

## Open questions

- None.
