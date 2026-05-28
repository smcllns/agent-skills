---
name: preserve-spike
description: Use when deciding whether to merge unfinished work, a spike, proof of concept, or learning branch/PR into main just to avoid losing it. Guides preserving exact repo snapshots with pushed annotated git tags instead of polluting product history.
---

# Preserve Spike

Use this when a branch or PR taught something valuable, but the code is not intended to become part of the product yet.

## Rule

- Merge to `main` = intended core addition to the product.
- Annotated tag = intended historic archive of the repo snapshot at this commit.
- Do not merge half-complete code only because the team is worried about losing it.

## Workflow

1. Identify the exact commit to preserve.
2. Create an annotated tag with a clear name and message.
3. Push the tag explicitly.
4. Link the tag or closed PR from the relevant status doc, plan, or handoff.
5. Close the PR unmerged if it was only a proof of concept.

```bash
git tag -a poc/<short-slug> <commit-sha> \
  -m "Preserve <short description>" \
  -m "Why this snapshot is worth keeping."

git push origin refs/tags/poc/<short-slug>
```

## Gotchas

- Tags are not pushed automatically.
- Tags are not automatically cleaned up.
- Pushed tags persist through local branch, remote branch, and worktree deletion.
- Tags can still be deleted intentionally; use protected tag patterns if stronger guarantees are needed.
- `keep-until/...` tag names are only a convention unless a cleanup process enforces them.
