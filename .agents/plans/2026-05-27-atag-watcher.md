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
  - Startup: print `Watching for @triggers agent tags in /path...`.
  - No match: print nothing and sleep until next interval; with `--debug`, print `no @triggers agent tags detected`.
  - Match: `cd` to target dir, invoke Claude, pass through Claude stdout/stderr, then sleep until next interval.
  - Claude command defaults: `claude -p --model sonnet --permission-mode acceptEdits`.
  - `--once`: perform one scan/invocation cycle, then exit with the scan/Claude result; used for tests and scheduler-agnostic future wrappers.
  - Debug: write scan path, triggers, matched files, and Claude command to stderr.
  - Signal handling: trap INT/TERM/HUP and exit cleanly so terminal close or Ctrl-C stops the loop.
- [x] Add `skills/atag/reference/atag-poll.test.ts`.
  - Use temp fixtures and a stub `claude` on `PATH`.
  - Test startup line plus no-match quiet behavior.
  - Test default trigger match invokes Claude once.
  - Test custom trigger parsing accepted/rejected cases.
  - Test `--dir` changes cwd for Claude.
  - Test unsealed `[!DONE]-` match invokes Claude.
  - Test debug no-match output is a single concise status line.
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
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts claude-plugins/atag/skills/atag/reference/markdown-agent-tags.spec.test.ts claude-plugins/atag/skills/atag/reference/atag-poll.test.ts codex-plugins/atag/skills/atag/reference/markdown-agent-tags.spec.test.ts codex-plugins/atag/skills/atag/reference/atag-poll.test.ts` passed: 174 pass, 0 fail.
- `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag` passed.
- `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag` passed.
- `git diff --check` passed.
- Quiet no-op smoke passed against a temp folder.
- Earlier live smoke passed against `skills/atag/dev`: poller found `fixture.md`, invoked `claude -p`, and Claude resolved four tags.
- Latest live no-op check passed against `skills/atag/dev`: with L5/L6 waiting on Claude and L8 clean, `--debug` printed `[HH:MM]  No @agent, @claude, @codex agent tags detected` and did not invoke Claude.

## Follow-up backlog from terminal testing

- [x] Prefix `--debug` no-match heartbeat with local time: `[HH:MM]  No @triggers agent tags detected`.
- [x] Add readable blank lines before `atag-poll: match ...` and after the `atag-poll: invoking ...` debug command.
- [x] Decide terminal-vs-markdown response style for Claude output.
  - Problem: skill output is useful Markdown by default, but noisy in a terminal.
  - Decision: add script arg `--response-style auto|terminal|markdown`; `auto` uses `[[ -t 1 ]]` and tells Claude to use terminal-appropriate plain text when stdout is a TTY.
  - Keep UI/menu-bar future use in mind: callers should be able to force Markdown.
- [x] Tighten `SKILL.md` final-output contract.
  - Output only: changes made, active threads left unchanged, or changes that should have happened but could not.
  - Do not mention already sealed `[!DONE]-` threads or false-positive text like L8 unless they blocked or explain a requested failure.
  - Avoid Markdown tables in terminal mode.
- [x] Fix active `[!NOTE]+` scan false positives before more poller testing.
  - Current problem: cheap grep flags every `[!NOTE]+` file even when Claude was the last speaker, so the poller keeps spawning Claude for threads waiting on the human.
  - Decision: make `<!--atag:eot-->` mean "agent yielded the turn" on every agent response, not only `[!DONE]-`.
  - Implementation shape: keep inline trigger grep cheap, move `[!NOTE]+` detection to a callout-aware scan that reports only unsealed active threads, and keep the existing `[!DONE]-` seal scan.
  - Backward compatibility: also skip legacy `[!NOTE]+` threads whose latest nonblank quoted line is an agent speaker label, even if it lacks the seal.
  - Verified against `skills/atag/dev/fixture.md`: after the CSS scratch text was removed, L8 does not trigger either scan; L5/L6 are skipped because Claude is the last speaker, so the poller does not invoke Claude.

## Current task list after run-2 testing

- [ ] Align on the exact `SKILL.md` wording for inline body tags.
  - Current decision shape: keep "preserve the original tag/request verbatim inside the callout" as the default invariant.
  - Narrow exception: if the tag was inline, such as on a task list item or inside a table cell, create a new callout immediately after the affected block, copy the original line verbatim into the callout, and remove the live trigger from the body.
  - Also allow modifying the original when prepending the user's speaker label for callout ergonomics, or when the user explicitly asks.
- [ ] Patch `skills/atag/SKILL.md` with the agreed wording.
- [ ] Add/update regression fixtures for inline task tags.
  - Example: checked task item should no longer keep a live `@claude` in the body after resolution.
  - Keep the cheap scanner simple; do not add historical body-vs-callout matching unless we explicitly decide the protocol cannot avoid it.
- [ ] Patch poller terminal UX.
  - Ctrl-C prints a one-line stop message.
  - Add a blank separator between Claude output and the next `atag-poll:` status line.
  - Replace duplicate debug match lines with a concise single-file summary like `atag-poll: found 1 agent tag (@agent, @claude, @codex) in dev/fixture-run2.md`.
  - Prefix the long invocation command with `[DEBUG]`; regular mode should use a short `spawning claude agent to resolve...` line.
- [ ] Decide speed defaults after one more local test.
  - Trace found first run was about 88s, mostly one long thinking block.
  - Candidate first tweak: add `--effort low` to poller Claude defaults.
  - Defer model switch to Haiku until we see whether low effort is enough.
- [ ] Run verification and sync.
  - `bash -n skills/atag/scripts/atag-poll.sh`
  - `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts`
  - `scripts/sync-skills.sh`
  - `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag`
  - `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag`
  - Copy/sync the active Claude skill path after repo verification.
