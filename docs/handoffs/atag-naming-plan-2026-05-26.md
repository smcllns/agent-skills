# Markdown Agent Tags naming handoff

## Current state

- Sam approved a new name: formal spec **Markdown Agent Tags**, technical surfaces `atag`.
- `docs/naming/atag.md` is the source of truth for naming.
- `.agents/plans/2026-05-26-atag-rename.md` is the implementation plan for the repo rename.
- This change intentionally stores the naming contract and plan only; it does not rename code yet.

## Repo surfaces to update later

- Canonical skill: `skills/md-asks/`
- Derived plugin copies: `claude-plugins/md-asks/skills/md-asks/`, `codex-plugins/md-asks/skills/md-asks/`
- Plugin packages and manifests:
  - `claude-plugins/md-asks/`
  - `codex-plugins/md-asks/`
  - `.claude-plugin/marketplace.json`
  - `.agents/plugins/marketplace.json`
- Current sync rule in `scripts/sync-skills.sh`: plugin dir name must match skill dir name.

## Gotchas

- The old repo policy said `Markdown asks` / `md-asks` / "agent asks in markdown"; it is now superseded.
- Do not write "ATAG" in brand prose because it collides with the W3C accessibility standard.
- Decide before implementation whether existing `<!--md-asks:eot-->` markers need transitional support.
- If the sync script still maps by matching directory name, rename the skill and both plugin dirs in the same implementation pass.

## Suggested first commands

```bash
git status --short --branch
rg -n "md-asks|Markdown asks|MD Asks|markdown-agent-asks|agent asks in markdown|md asks|markdown-agent-directives|ATAG|Atag|atags" .
```
