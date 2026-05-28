# atag speaker-label prefill handoff

## Context

`atag` is moving toward clean callout threads where every turn has a speaker label:

```md
> *`sam`* @claude make this more concrete
>
> `claude` Which direction should I take it? <!--atag:eot-->
```

This renders well and gives agents a consistent turn structure. The UX problem: humans should not have to manually type ``> *`sam`* `` or learn that syntax just to reply.

## Current state

- Run-3 is ready to test the inline-tag protocol change separately.
- Do not mix this project into run-3.
- Current skill wording already allows prepending the user's speaker label for callout ergonomics, but it does not yet provide a clean authoring affordance.

## Project goal

When an agent leaves an active thread waiting on Sam, the markdown should already contain the next human speaker label so Sam can just type after it.

Desired shape:

```md
> [!NOTE]+ awaiting direction
>
> *`sam`* @claude make this better
>
> `claude` Which direction should I take it? <!--atag:eot-->
>
> *`sam`* 
```

## Critical scanner issue

A prefilled label-only line must not count as a human reply.

If the scanner sees the above and immediately respawns Claude, the feature fails. The scanner needs to treat a quoted line that is only a human speaker label (plus whitespace) as placeholder/blank for turn-detection purposes.

But once Sam types real content:

```md
> *`sam`* make it more concrete
```

the thread should become actionable again.

## Recommended v1

1. Keep scope to active `[!NOTE]+` threads.
2. Agent responses that ask for human input should end with `<!--atag:eot-->`, then append:

   ```md
   >
   > *`sam`* 
   ```

3. Update scanner logic and fixtures so label-only human placeholders are skipped.
4. Update examples/docs so humans understand agents/tools provide or normalize labels; users are not expected to type raw markdown syntax.

## Tests to add

- `[!NOTE]+` with agent `<!--atag:eot-->` and trailing ``> *`sam`* `` is not matched.
- `[!NOTE]+` with trailing ``> *`sam`* actual reply`` is matched.
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

- `skills/atag/scripts/atag-poll.sh` now treats emphasized inline-code label-only human lines like ``*`sam`*`` as placeholders for latest-turn detection.
- `skills/atag/reference/markdown-agent-tags.spec.md` has fixtures for skipped placeholders and actionable typed replies after a prefilled label.
- `skills/atag/reference/atag-poll.test.ts` covers both the trailing-space placeholder and the real typed reply.
- `skills/atag/SKILL.md` says agents/tools prefill or normalize human labels; humans should not have to type raw speaker-label markdown.
- `skills/atag/reference/markdown-agent-tags.spec.test.ts` stays in sync with the documented awk scanner.
- Plugin copies were regenerated with `scripts/sync-skills.sh`.
- Active local copies were synced:
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

Still required before merge:

- Commit, push, and open the PR.
- Run adversarial independent review and classify findings into blockers vs acceptable experiment risk.
- Fix blockers or record explicit reclassification rationale.
