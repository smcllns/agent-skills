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

- [ ] Update the `atag` callout protocol so every real turn starts with a speaker label.
- [ ] For active `[!NOTE]+` threads where the agent is explicitly waiting on the human, prefill a trailing human speaker line:
  - quoted blank separator
  - quoted user label line, e.g. ``> *`sam`* ``
  - cursor/user can type directly after the trailing space.
- [ ] Update the scanner to ignore human-label-only placeholder lines when deciding whether the human has replied.
- [ ] Do not prefill completed `[!DONE]-` threads in v1 unless there is a clear follow-up prompt. Keep v1 narrow.
- [ ] Keep raw markdown examples from making users feel they must type syntax manually. Skill docs should say agents/tools prefill or normalize labels for humans.

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

## Non-goals

- Do not solve editor/UI automation yet unless Sam explicitly asks. Start with agent-created placeholders plus scanner support.
- Do not broaden the scanner into a full markdown parser.
- Do not block run-3; run-3 is for inline body-trigger cleanup and no-second-spawn behavior.

## Unresolved questions

- Should the human speaker name always be `sam`, or should it be configurable per repo/user?
- Should `[!DONE]-` threads ever prefill a reply line, or should only `[!NOTE]+` do that?
- Should placeholder lines include an explicit marker/comment, or is "speaker label only" enough?
