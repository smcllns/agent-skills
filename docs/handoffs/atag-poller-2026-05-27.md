# atag foreground poller handoff

## What changed

- Added `skills/atag/scripts/atag-poll.sh`, a foreground polling loop that runs cheap markdown scans every 60 seconds and invokes `claude -p` only when unresolved tags exist.
- Added `skills/atag/reference/atag-poll.test.ts` with stubbed-Claude coverage for startup output, quiet no-match, debug no-match, custom trigger parsing, DONE follow-ups, passthrough args, target cwd, and Claude failure propagation.
- Documented terminal polling in `skills/atag/SKILL.md` and `claude-plugins/atag/README.md`; synced canonical skill copies into Claude and Codex plugin trees.

## Decisions

- No launchd/cron for v1. Closing the terminal kills the poller.
- No lock file for v1. A single foreground loop blocks while Claude runs, then sleeps and scans again.
- Custom triggers replace defaults. `@pi` means only `@pi`, not `agent claude codex pi`.
- Default Claude command is `claude -p --model sonnet --permission-mode acceptEdits --effort low`; callers can pass normal Claude args after `--`, including `--model haiku --effort low` for speed checks.
- Claude has no max-turns flag in current help output, so the script uses a 30-minute subprocess timeout.

## Gotchas

- `/atag`, `/skill:atag`, and `/skill atag` are not Claude Code commands; the script invokes the installed skill by natural-language prompt.
- On Sam's machine, Claude Code loads skills through `/Users/smcllns/Projects/dotfiles/skills`, so the installed `atag` skill had to be copied there before `claude -p` could see it.
- `skills/atag/dev/` is local scratch with unresolved tags. It is gitignored and excluded from `scripts/sync-skills.sh`; use `diff -qr -x dev ...` for drift checks.

## Follow-up items from terminal testing

- Done in this branch: debug no-match now prints `[HH:MM]  No @triggers agent tags detected`; debug match output has a blank line before `atag-poll: match ...` and after `atag-poll: invoking ...`.
- Done in this branch: `--response-style auto|terminal|markdown`; `auto` checks `[[ -t 1 ]]`, terminal mode asks Claude for plain text with no Markdown tables, and future UI/menu-bar callers can force Markdown.
- Done in this branch: `SKILL.md` final output now reports only changes made, active threads left unchanged, or changes it could not make. It should not summarize already sealed `[!DONE]-` threads or false positives unless they matter to the requested result.
- Done in this branch: `[!NOTE]+` detection moved out of raw grep and into a callout-aware scanner. `<!--atag:eot-->` now means the agent yielded the turn on every agent response, not only `[!DONE]-`; legacy active threads whose latest line is an agent speaker label are skipped too.
- Verified against `skills/atag/dev/fixture.md`: after the temporary CSS scratch text was removed, L8 does not trigger either scan; L5/L6 are skipped because Claude is the last speaker, so the poller does not invoke Claude.

## Verification

- `bash -n skills/atag/scripts/atag-poll.sh`
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts claude-plugins/atag/skills/atag/reference/markdown-agent-tags.spec.test.ts claude-plugins/atag/skills/atag/reference/atag-poll.test.ts codex-plugins/atag/skills/atag/reference/markdown-agent-tags.spec.test.ts codex-plugins/atag/skills/atag/reference/atag-poll.test.ts` — 174 pass, 0 fail
- `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag`
- `git diff --check`
- Earlier live smoke: `skills/atag/scripts/atag-poll.sh --once --debug --dir /Users/smcllns/Projects/skills/skills/atag/dev -- --max-budget-usd 5` resolved four tags in the ignored dev fixture.
- Latest live no-op check: `skills/atag/scripts/atag-poll.sh --once --debug --dir skills/atag/dev --timeout 1 -- --max-budget-usd 0.01` printed `[HH:MM]  No @agent, @claude, @codex agent tags detected` and did not invoke Claude.
