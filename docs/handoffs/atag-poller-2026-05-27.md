# atag foreground poller handoff

## What changed

- Added `skills/atag/scripts/atag-poll.sh`, a foreground polling loop that runs cheap markdown scans every 60 seconds and invokes `claude -p` only when unresolved tags exist.
- Added `skills/atag/reference/atag-poll.test.ts` with stubbed-Claude coverage for startup output, quiet no-match, debug no-match, custom trigger parsing, DONE follow-ups, passthrough args, target cwd, and Claude failure propagation.
- Documented terminal polling in `skills/atag/SKILL.md` and `claude-plugins/atag/README.md`; synced canonical skill copies into Claude and Codex plugin trees.

## Decisions

- No launchd/cron for v1. Closing the terminal kills the poller.
- No lock file for v1. A single foreground loop blocks while Claude runs, then sleeps and scans again.
- Custom triggers replace defaults. `@pi` means only `@pi`, not `agent claude codex pi`.
- Default Claude command is `claude -p --model sonnet --permission-mode acceptEdits`; callers can pass normal Claude args after `--`.
- Claude has no max-turns flag in current help output, so the script uses a 30-minute subprocess timeout.

## Gotchas

- `/atag`, `/skill:atag`, and `/skill atag` are not Claude Code commands; the script invokes the installed skill by natural-language prompt.
- On Sam's machine, Claude Code loads skills through `/Users/smcllns/Projects/dotfiles/skills`, so the installed `atag` skill had to be copied there before `claude -p` could see it.
- `skills/atag/dev/` is local scratch with unresolved tags. It is gitignored and excluded from `scripts/sync-skills.sh`; use `diff -qr -x dev ...` for drift checks.

## Follow-up items from terminal testing

- Done in this branch: debug no-match now prints `[HH:MM]  No @triggers agent tags detected`; debug match output has a blank line before `atag-poll: match ...` and after `atag-poll: invoking ...`.
- Terminal-vs-Markdown output is unresolved. Suggested simple design: add `--response-style auto|terminal|markdown`; `auto` checks `[[ -t 1 ]]`, terminal mode tells Claude to avoid Markdown tables/links and use plain text, future UI/menu-bar callers can force Markdown.
- Tighten `SKILL.md` final output so Claude reports only changes made, active threads left unchanged, or changes it could not make. It should not summarize already sealed `[!DONE]-` threads or false positives unless they matter to the requested result.
- Bigger spec issue: `[!NOTE]+` grep is too broad for polling. It spawns Claude even when Claude was the last speaker and the thread is waiting on the human. Fresh-agent options to evaluate:
  - richer pre-scan that only reports `[!NOTE]+` threads whose latest speaker is human or original inline tag has no agent reply;
  - seal every agent reply, not only `[!DONE]-`, then update scan logic;
  - keep file grep but add a second scanner that suppresses all-agent-last files before invoking Claude.
- After fixing active-thread scanning, rerun `skills/atag/dev/fixture.md` to verify whether L8 is truly causing Claude to spawn or only gets mentioned because other tags caused the file to be read.

## Verification

- `bash -n skills/atag/scripts/atag-poll.sh`
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts claude-plugins/atag/skills/atag/reference/atag-poll.test.ts codex-plugins/atag/skills/atag/reference/atag-poll.test.ts` — 156 pass, 0 fail
- `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag`
- `git diff --check`
- Live smoke: `skills/atag/scripts/atag-poll.sh --once --debug --dir /Users/smcllns/Projects/skills/skills/atag/dev -- --max-budget-usd 5` resolved four tags in the ignored dev fixture.
