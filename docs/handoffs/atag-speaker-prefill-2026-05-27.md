# atag speaker-label prefill handoff

## Context

`atag` is moving toward clean callout threads where every turn has a speaker label:

```md
> `sam` @claude make this more concrete
>
> *`claude`* Which direction should I take it? <!--atag:eot-->
```

This renders well and gives agents a consistent turn structure. The UX problem: humans should not have to manually type ``> `sam` `` or learn that syntax just to reply.

In this handoff, `sam` is the local example human label. The poller now accepts `--name`/`--user-name` for the agent's known name for the human, then falls back through local identity sources before using `user`.

## Current state

- Run-3 is ready to test the inline-tag protocol change separately.
- Do not mix this project into run-3.
- Current skill wording already allows prepending the user's speaker label for callout ergonomics, but it does not yet provide a clean authoring affordance.

## Project goal

When an agent leaves an active thread waiting on the human, the markdown should already contain the next human speaker label so the human can just type after it.

Desired shape:

```md
> [!NOTE]+ awaiting direction
>
> `sam` @claude make this better
>
> *`claude`* Which direction should I take it? <!--atag:eot-->
>
> `sam`
```

## Critical scanner issue

A prefilled label-only line must not count as a human reply.

If the scanner sees the above and immediately respawns Claude, the feature fails. The scanner needs to treat a quoted line that is only a human speaker label (plus whitespace) as placeholder/blank for turn-detection purposes.

But once the human types real content:

```md
> `sam` make it more concrete
```

the thread should become actionable again.

## Recommended v1

1. Keep scope to active `[!NOTE]+` threads.
2. Agent responses that ask for human input should end with `<!--atag:eot-->`, then append:

   ```md
   >
   > `sam`
   ```

3. Update scanner logic and fixtures so label-only human-label placeholders are skipped.
4. Update examples/docs so humans understand agents/tools provide or normalize labels; users are not expected to type raw markdown syntax.

## Tests to add

- `[!NOTE]+` with agent `<!--atag:eot-->` and trailing ``> `sam` `` is not matched.
- `[!NOTE]+` with trailing ``> `sam` actual reply`` is matched.
- Legacy colon-form agent labels still work if currently supported.
- Existing no-second-spawn behavior for sealed `[!DONE]-` remains unchanged.

## Suggested first commands

```sh
cd /Users/smcllns/Projects/skills
git status --short --branch
sed -n '45,95p' skills/atag/SKILL.md
sed -n '1,230p' skills/atag/scripts/atag-poll.sh
```

Then write the fixtures first, watch them fail, patch scanner/docs, sync copies, and rerun the target tests.

## PR and review requirement

End this project by opening a PR.

Before merge, get an adversarial independent review that tries to find launch blockers and edge cases. The review should explicitly classify findings:

- Blocking before merge
- Nice to have / acceptable experiment risk

The goal is transparency, not perfection. It is valid to skip non-blocking findings to launch the experiment, but the PR or plan must record the decision and rationale for every skipped item.

## Implementation update — 2026-05-27

Implemented on `codex/atag-poller`:

- `skills/atag/scripts/atag-poll.sh` now treats bare inline-code label-only human-label lines like `` `sam` `` as placeholders for latest-turn detection, while still skipping legacy emphasized human placeholders.
- `skills/atag/reference/markdown-agent-tags.spec.md` has fixtures for skipped placeholders, same-line replies after a prefilled label, and next-line replies after a prefilled label.
- `skills/atag/reference/atag-poll.test.ts` covers the trailing-space placeholder, same-line typed reply, and next-line typed reply.
- `skills/atag/SKILL.md` says agents/tools prefill or normalize human labels; humans should not have to type raw speaker-label markdown.
- `skills/atag/reference/markdown-agent-tags.spec.test.ts` stays in sync with the documented awk scanner.
- Plugin copies were regenerated with `scripts/sync-skills.sh`.
- Active local copies were synced:
  - `/Users/smcllns/Projects/dotfiles/skills/atag`
  - `/Users/smcllns/.agents/skills/atag`

Follow-up label swap in the same PR:

- Current human labels are bare inline code, e.g. `` `sam` reply``.
- Current agent labels are emphasized inline code, e.g. ``*`claude`* reply``.
- Companion CSS moved the accented rendered style to bare inline-code labels, so the human label keeps its previous visual treatment after the raw markdown swap.
- The scanner still recognizes legacy bare and colon-form agent labels, and still skips legacy emphasized label-only human placeholders.

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

Still required before merge:

- Keep PR #29 scoped to the stacked base branch `codex/atag-poller-base` unless deliberately expanding the merge unit.
- Merge only after the stacked PR shape is approved.

## Independent review result — 2026-05-27

Adversarial review completed for PR #29.

Blocking before merge:

- Finding: PR #29 was originally opened against `main`, so the visible PR diff included earlier atag poller/run-3-adjacent history instead of only the speaker-prefill change.
- Resolution: pushed `codex/atag-poller-base` at handoff commit `44fc87b` and retargeted PR #29 to that base. This makes the PR review surface the standalone speaker-prefill delta.

Nice to have / acceptable experiment risk:

- Finding: `git diff --check origin/main...origin/codex/atag-poller` failed on older trailing-space examples outside this speaker-prefill delta.
- Resolution: retargeted the PR; the relevant stacked diff check is `git diff --check 44fc87b..HEAD`.
- Finding: automated coverage did not include leaving the placeholder label in place and typing the reply on the next quoted line.
- Resolution: added source fixture and poller test for that case.

Follow-up review after the label swap found no blockers.

Nice to have / acceptable experiment risk:

- Finding: the placeholder regex was too broad and skipped a code-only reply like `` `bun` `` after a prefilled label.
- Resolution: limited placeholder detection to the skill's human label and added source/poller coverage for the code-only reply case.
- Finding: stale handoff prose still showed the previous raw label contract.
- Resolution: updated stale handoff examples and companion CSS handoff wording.

## Fast-follow decisions after PR #29

PR #29 merged with three settled-but-still-labeled "unresolved questions" in the plan. Fast-follow PR #30 records them as closed decisions:

- Human speaker name: v1 accepts the agent's known human name with `--name`/`--user-name`, then falls back to `git config user.name`, GitHub user name/login, Unix username, and finally a non-colliding generic label, usually `user`.
- `[!DONE]-` prefill: no v1 prefill for DONE follow-ups. DONE threads are already append-friendly after `<!--atag:eot-->`; prefill stays scoped to active `[!NOTE]+` turns waiting on the human.
- Placeholder marker/comment: no explicit marker for known human labels. A label-only human line is readable and sufficient when the name is known; only the generic missing-name fallback gets the scanner-ignored `<!--atag:missing-human-name ...-->` recovery comment.
- Legacy label support: keep scanning support for old bare/colon agent labels and legacy emphasized human-label placeholders so existing notes do not wake up due to the syntax migration.

No open v1 speaker-prefill questions remain after these decisions.

PR #30/31 follow-up after review:

- Added `--name`/`--user-name` for the agent's known human name.
- Added fallback identity resolution: git name, GitHub user name, Unix username, then a non-colliding generic label, usually `user`.
- Added a scanner-ignored `<!--atag:missing-human-name ...-->` comment for the final fallback.
- Fixed the independent-review blocker where a human label colliding with an agent trigger, such as `codex`, could make a real human reply look like an agent-last line. Explicit colliding `--name` values now fail loud; fallback identities that collide with the trigger set are skipped.

Fast-follow verification passed:

- `bash -n skills/atag/scripts/atag-poll.sh`
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts skills/atag/reference/atag-poll.test.ts` - 243 pass, 0 fail
- `scripts/sync-skills.sh`
- `diff -qr -x dev skills/atag claude-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag codex-plugins/atag/skills/atag`
- `diff -qr -x dev skills/atag /Users/smcllns/Projects/dotfiles/skills/atag`
- `diff -qr -x dev skills/atag /Users/smcllns/.agents/skills/atag`
- `git diff --check`
