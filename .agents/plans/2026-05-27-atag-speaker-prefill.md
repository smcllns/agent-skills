# atag speaker-label prefill plan

## Goal

Make agent-tag callouts ergonomic for humans: users should not have to manually type markdown speaker-label syntax like ``> *`sam`* `` before replying.

## Problem

The protocol wants every callout turn to have a speaker label so rendered threads show clean sender chips and agents can parse turns consistently.

But if the docs show raw speaker-label markdown, users may think they are expected to type all those symbols themselves. That is bad UX.

## Key constraint

Do not let an empty prefilled human speaker line trigger the poller.

Example placeholder:

```md
> `claude` Which direction should I take it? <!--atag:eot-->
>
> *`sam`* 
```

Current callout scanning would treat the `*sam*` line as the latest nonblank human turn and may immediately spawn the agent again. Any implementation must make label-only placeholders count as "still waiting on human" until the user types real content after the label.

## Proposed approach

- [x] Update the `atag` callout protocol so every real turn starts with a speaker label.
- [x] For active `[!NOTE]+` threads where the agent is explicitly waiting on the human, prefill a trailing human speaker line:
  - quoted blank separator
  - quoted user label line, e.g. ``> *`sam`*``
  - cursor/user can type directly after the trailing space.
- [x] Update the scanner to ignore human-label-only placeholder lines when deciding whether the human has replied.
- [x] Do not prefill completed `[!DONE]-` threads in v1 unless there is a clear follow-up prompt. Keep v1 narrow.
- [x] Keep raw markdown examples from making users feel they must type syntax manually. Skill docs should say agents/tools prefill or normalize labels for humans.

## Likely files

- `skills/atag/SKILL.md`
- `skills/atag/reference/markdown-agent-tags.spec.md`
- `skills/atag/reference/markdown-agent-tags.spec.test.ts`
- `skills/atag/scripts/atag-poll.sh`
- `skills/atag/reference/atag-poll.test.ts`
- synced copies via `scripts/sync-skills.sh`

## Verification

- Add fixture: active `[!NOTE]+` ending with agent `<!--atag:eot-->` plus placeholder ``> *`sam`* `` is skipped.
- Add fixture: same thread with ``> *`sam`* actual reply`` is matched.
- Run:
  - `bash -n skills/atag/scripts/atag-poll.sh`
  - `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts`
  - `scripts/sync-skills.sh`
  - plugin drift checks.

## Review and launch gate

- [ ] Open a PR for the completed change.
- [ ] Get an adversarial independent review before merge.
  - Ask the reviewer to find launch blockers, regressions, and edge cases.
  - Require the review to split findings into "blocking before merge" and "nice to have / acceptable experiment risk".
- [ ] Update this plan or the PR description with the decision on every review finding.
  - It is valid to skip non-blocking items to launch the experiment.
  - If skipping something, explicitly record why it is acceptable for this experiment and what would make it blocking later.
- [ ] Merge only after blocking findings are fixed or explicitly reclassified with rationale.

## Implementation status — 2026-05-27

- [x] Added source fixtures proving label-only ``*`sam`*`` placeholders are skipped and typed replies after the label are actionable.
- [x] Added poller tests for a trailing-space placeholder and real typed reply.
- [x] Patched `skills/atag/scripts/atag-poll.sh` to ignore emphasized inline-code label-only human placeholder lines for latest-turn detection.
- [x] Updated `skills/atag/SKILL.md` and `skills/atag/reference/markdown-agent-tags.spec.md` so agents/tools prefill or normalize labels and humans are not expected to type raw syntax.
- [x] Ran `scripts/sync-skills.sh`; plugin copies match canonical.
- [x] Synced active local copies:
  - `/Users/smcllns/Projects/dotfiles/skills/atag`
  - `/Users/smcllns/.agents/skills/atag`

Verification passed:

- `bash -n skills/atag/scripts/atag-poll.sh`
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts` — 195 pass, 0 fail
- `scripts/sync-skills.sh`
- `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag /Users/smcllns/Projects/dotfiles/skills/atag`
- `diff -qr -x dev skills/atag /Users/smcllns/.agents/skills/atag`
- `git diff --check`

## Non-goals

- Do not solve editor/UI automation yet unless Sam explicitly asks. Start with agent-created placeholders plus scanner support.
- Do not broaden the scanner into a full markdown parser.
- Do not block run-3; run-3 is for inline body-trigger cleanup and no-second-spawn behavior.

## Unresolved questions

- Human speaker name: v1 documents `sam`; scanner ignores any emphasized inline-code label-only placeholder so future names do not retrigger.
- `[!DONE]-` prefill: no v1 change; active `[!NOTE]+` only.
- Placeholder marker/comment: no marker; "speaker label only" is enough for v1.
