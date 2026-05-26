# Markdown Agent Tags naming handoff

## Current state

- Sam approved a new name: formal spec **Markdown Agent Tags**, technical surfaces `atag`.
- `docs/naming/atag.md` is the source of truth for naming.
- `.agents/plans/2026-05-26-atag-rename.md` is complete and records the implementation decisions.
- PR #27 now contains the full rename implementation, not just the naming plan.

## Renamed surfaces

- Canonical skill: `skills/atag/`
- Derived plugin copies: `claude-plugins/atag/skills/atag/`, `codex-plugins/atag/skills/atag/`
- Plugin packages and manifests:
  - `claude-plugins/atag/`
  - `codex-plugins/atag/`
  - `.claude-plugin/marketplace.json`
  - `.agents/plugins/marketplace.json`
- Current sync rule in `scripts/sync-skills.sh`: plugin dir name must match skill dir name.

## Gotchas

- The previous repo naming policy is superseded by `docs/naming/atag.md`.
- Do not write "ATAG" in brand prose because it collides with the W3C accessibility standard.
- New resolved threads use `<!--atag:eot-->`.
- No pre-rename seal compatibility is kept; the seal was introduced the same day as the rename, so `<!--atag:eot-->` is the only supported seal.
- Old-name discoverability docs were removed after the zero-lingering-reference review; marketplace manifests do not keep deprecated plugin entries.

## Verification run

- `scripts/sync-skills.sh`
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts` — 132 pass, 0 fail
- `diff -qr skills/atag claude-plugins/atag/skills/atag`
- `diff -qr skills/atag codex-plugins/atag/skills/atag`
- `git diff --check`
- Stale-name grep: no remaining hits for the old skill name or old description phrases.

## Suggested first commands

```bash
git status --short --branch
rg -n --hidden --glob '!.git/**' "Markdown Agent Tags|atag|@agent" .
```
