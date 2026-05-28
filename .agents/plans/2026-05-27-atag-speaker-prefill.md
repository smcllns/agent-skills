# atag speaker-label prefill plan

## Goal

Make agent-tag callouts ergonomic for humans: users should not have to manually type markdown speaker-label syntax like ``> `sam` `` before replying.

In this plan, `sam` is the local example human label. Replace it with the human's preferred short label and pass that same label to the poller with `--human-label`.

## Problem

The protocol wants every callout turn to have a speaker label so rendered threads show clean sender chips and agents can parse turns consistently.

But if the docs show raw speaker-label markdown, users may think they are expected to type all those symbols themselves. That is bad UX.

## Key constraint

Do not let an empty prefilled human speaker line trigger the poller.

Example placeholder:

```md
> *`claude`* Which direction should I take it? <!--atag:eot-->
>
> `sam`
```

Current callout scanning would treat the human label line as the latest nonblank human turn and may immediately spawn the agent again. Any implementation must make label-only placeholders count as "still waiting on human" until the user types real content after the label.

## Proposed approach

- [x] Update the `atag` callout protocol so every real turn starts with a speaker label.
- [x] For active `[!NOTE]+` threads where the agent is explicitly waiting on the human, prefill a trailing human speaker line:
  - quoted blank separator
  - quoted configured human label line, e.g. ``> `sam` ``
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

- Add fixture: active `[!NOTE]+` ending with agent `<!--atag:eot-->` plus placeholder ``> `sam` `` is skipped.
- Add fixture: same thread with ``> `sam` actual reply`` is matched.
- Run:
  - `bash -n skills/atag/scripts/atag-poll.sh`
  - `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts`
  - `scripts/sync-skills.sh`
  - plugin drift checks.

## Review and launch gate

- [x] Open a PR for the completed change.
- [x] Get an adversarial independent review before merge.
  - Ask the reviewer to find launch blockers, regressions, and edge cases.
  - Require the review to split findings into "blocking before merge" and "nice to have / acceptable experiment risk".
- [x] Update this plan or the PR description with the decision on every review finding.
  - It is valid to skip non-blocking items to launch the experiment.
  - If skipping something, explicitly record why it is acceptable for this experiment and what would make it blocking later.
- [x] Merge only after blocking findings are fixed or explicitly reclassified with rationale.

## Implementation status — 2026-05-27

- [x] Swapped current speaker-label syntax: humans use bare inline code like `` `sam` ``, agents use emphasized inline code like ``*`claude`*``.
- [x] Moved companion CSS role styling so human labels keep the accented rendered style and agent labels keep the quieter rendered style.
- [x] Added source fixtures proving label-only human-label placeholders are skipped and typed replies after or below the label are actionable, including a code-only reply.
- [x] Added poller tests for a trailing-space placeholder, a legacy emphasized placeholder, a real same-line typed reply, a next-line typed reply, and a code-only reply.
- [x] Patched `skills/atag/scripts/atag-poll.sh` to ignore bare and legacy emphasized label-only human placeholder lines for latest-turn detection.
- [x] Updated `skills/atag/SKILL.md` and `skills/atag/reference/markdown-agent-tags.spec.md` so agents/tools prefill or normalize labels and humans are not expected to type raw syntax.
- [x] Ran `scripts/sync-skills.sh`; plugin copies match canonical.
- [x] Synced active local copies:
  - `/Users/smcllns/Projects/dotfiles/skills/atag`
  - `/Users/smcllns/.agents/skills/atag`

Verification passed:

- `bash -n skills/atag/scripts/atag-poll.sh`
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts` — 216 pass, 0 fail
- `scripts/sync-skills.sh`
- `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag /Users/smcllns/Projects/dotfiles/skills/atag`
- `diff -qr -x dev skills/atag /Users/smcllns/.agents/skills/atag`
- `git diff --check`
- `git diff --check 44fc87b..HEAD`

## Independent review — 2026-05-27

Adversarial review completed.

Blocking before merge:

- PR #29 was originally opened against `main`, so the PR diff included older atag poller/run-3-adjacent commits instead of only this speaker-prefill change.
  - Decision: fixed by pushing `codex/atag-poller-base` at the handoff base commit `44fc87b` and retargeting PR #29 to that branch. The PR diff now isolates this speaker-prefill change from prior branch history.

Nice to have / acceptable experiment risk:

- Reviewer noted `git diff --check origin/main...origin/codex/atag-poller` failed on older handoff-example trailing spaces outside this change.
  - Decision: fixed by scoping the PR to `codex/atag-poller-base`; `git diff --check 44fc87b..HEAD` is the relevant check for this stacked PR and passes.
- Reviewer noted coverage did not include the case where the placeholder label remains and the human replies on the next quoted line.
  - Decision: fixed with an added spec fixture and poller regression test.
- Follow-up review of the label-swap commit found no blockers.
- Follow-up reviewer noted the placeholder regex was too broad and could skip a code-only reply like `` `bun` `` after a prefilled label.
  - Decision: fixed by limiting placeholder detection to the configured human label and adding source/poller coverage for the code-only reply case.
- Follow-up reviewer noted stale handoff prose still showed the previous raw label contract.
  - Decision: fixed the stale handoff examples and companion CSS handoff wording.

## Non-goals

- Do not solve editor/UI automation yet unless explicitly asked. Start with agent-created placeholders plus scanner support.
- Do not broaden the scanner into a full markdown parser.
- Do not block run-3; run-3 is for inline body-trigger cleanup and no-second-spawn behavior.

## Decisions closed after PR #29

- [x] Human speaker name:
  - Decision: v1 uses a configured human label, defaulting to `sam` for this local workflow.
  - Why: reusable docs need to say "replace `sam` with the user's label"; the poller must support that instead of hardcoding one human name.
  - Revisit if: labels need spaces, punctuation, or multiple humans in one thread.
- [x] `[!DONE]-` prefill:
  - Decision: do not prefill `[!DONE]-` follow-up lines in v1.
  - Why: DONE threads are already append-friendly after `<!--atag:eot-->`; prefill belongs to active `[!NOTE]+` turns where the agent is explicitly waiting on the human.
  - Revisit if: humans routinely miss where to type DONE follow-ups.
- [x] Placeholder marker/comment:
  - Decision: no explicit marker/comment.
  - Why: a label-only human line is readable and sufficient; hidden comments would add protocol noise.
  - Revisit if: tests show label-only placeholders are ambiguous in real notes.
- [x] Legacy label support:
  - Decision: keep scanning support for legacy bare/colon agent labels and legacy emphasized human-label placeholders.
  - Why: old notes should not wake up just because the syntax changed.

No open v1 speaker-prefill questions remain after these decisions.

PR #30 follow-up after review:

- [x] Added `--human-label`, defaulting to `sam`, so reusable docs can truthfully say to replace `sam` with the user's preferred short label.
- [x] Added poller coverage for a configured non-Sam label-only placeholder, a configured non-Sam real reply, and invalid label validation.

Fast-follow verification passed:

- `bash -n skills/atag/scripts/atag-poll.sh`
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts` - 225 pass, 0 fail
- `scripts/sync-skills.sh`
- `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag /Users/smcllns/Projects/dotfiles/skills/atag`
- `diff -qr -x dev skills/atag /Users/smcllns/.agents/skills/atag`
- `git diff --check`
