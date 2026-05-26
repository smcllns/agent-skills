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

- The old repo policy said `Markdown asks` / `md-asks` / "agent asks in markdown"; it is now superseded.
- Do not write "ATAG" in brand prose because it collides with the W3C accessibility standard.
- New resolved threads use `<!--atag:eot-->`.
- Existing `<!--md-asks:eot-->` seals remain recognized by the DONE scan so old resolved threads do not reopen during migration.
- Old-name discoverability lives in `docs/naming/md-asks.md`; marketplace manifests do not keep deprecated `md-asks` plugin entries.

## Verification run

- `scripts/sync-skills.sh`
- `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts` — 132 pass, 0 fail
- `diff -qr skills/atag claude-plugins/atag/skills/atag`
- `diff -qr skills/atag codex-plugins/atag/skills/atag`
- `git diff --check`
- Stale-name grep: remaining hits are intentional legacy-seal compatibility, naming anti-examples, and the old-name redirect doc.

## Suggested first commands

```bash
git status --short --branch
rg -n --hidden --glob '!.git/**' "md-asks|Markdown asks|MD Asks|markdown-agent-asks|agent asks in markdown|md asks|markdown-agent-directives|ATAG|Atag|atags" .
```
