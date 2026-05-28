# atag Opus default handoff

## Context

Run-3b through run-3e compared Haiku low, Opus low, Sonnet low, and Sonnet default effort on the same `skills/atag/dev/fixture-run3.md` shape. The ignored dev sidecar has raw run notes, but the tracked ADR is the durable evidence surface.

## Decision

Set the foreground poller default to `claude -p --model opus --permission-mode acceptEdits --effort low` for the current experiment.

This is temporary and evidence-backed, not final. The cheap pre-scan still prevents no-op token burn; when the poller wakes Claude, correctness matters more than shaving a few seconds on a single-file run.

## Follow-up

Use GitHub issue [#37](https://github.com/smcllns/skills/issues/37) for the broader model/effort eval before treating Opus low as the permanent default.

## Verification

- `bash -n` passed for canonical, plugin, and active installed `atag-poll.sh` copies.
- Canonical/plugin/active skill copies matched with `diff -qr -x dev`.
- No stale default-Sonnet references remained outside override examples.
- Independent Haiku PR review found a timeout/interrupt blocker where `run_with_timeout()` had lost `exec`, which could leave Claude orphaned. Fixed by restoring `exec "$@"` and adding a timeout regression test.
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts claude-plugins/atag/skills/atag/reference/markdown-agent-tags.spec.test.ts claude-plugins/atag/skills/atag/reference/atag-poll.test.ts codex-plugins/atag/skills/atag/reference/markdown-agent-tags.spec.test.ts codex-plugins/atag/skills/atag/reference/atag-poll.test.ts` passed: 249 pass, 0 fail.
- Stubbed default invocation printed `--model opus --permission-mode acceptEdits --effort low`.
