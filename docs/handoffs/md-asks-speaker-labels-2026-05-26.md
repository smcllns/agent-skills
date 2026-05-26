# md-asks speaker labels handoff

## Decision

Sam selected the compact raw-markdown speaker-label protocol:

- Triggers remain `@claude`, `@codex`, etc.
- Agent replies use plain inline-code labels: `` `claude`: ...``.
- Human replies use emphasized inline-code labels: ``*`sam`*: ...``.
- The colon stays outside the label.
- Do not preserve `@name:` as a speaker-label format.

## Implementation Notes

Canonical source is `skills/md-asks/`; run `scripts/sync-skills.sh` to refresh Claude/Codex plugin copies.

Companion CSS should style `p > code:first-child` as the quieter agent label and `p > em:first-child > code:first-child` as the emphasized human label. Use Obsidian variables with fallbacks.

## Validation

- `scripts/sync-skills.sh`
- `diff -qr skills/md-asks claude-plugins/md-asks/skills/md-asks`
- `diff -qr skills/md-asks codex-plugins/md-asks/skills/md-asks`
- `bun test skills/md-asks/reference/markdown-agent-directives.spec.test.ts` passed with 126 tests.
- `git diff --check`

## PR

- https://github.com/smcllns/skills/pull/26
