# md-asks installed smoke - 2026-05-23

## Verified

- Installed Codex plugin cache exists at `/Users/smcllns/.codex/plugins/cache/smcllns-skills/md-asks/0.1.0`.
- Installed metadata validates for `name=md-asks`, `version=0.1.0`, `skills=./skills/`, and `Read`/`Write` capabilities.
- Installed skill entrypoint is present at `skills/md-asks/SKILL.md` inside the plugin cache.
- Installed cache scan tests pass: `bun test /Users/smcllns/.codex/plugins/cache/smcllns-skills/md-asks/0.1.0/skills/md-asks/reference/markdown-agent-directives.spec.test.ts` reported `27 pass, 0 fail`.
- Repo tests pass:
  - `bun test skills/md-asks/reference/markdown-agent-directives.spec.test.ts` reported `81 pass, 0 fail` across the canonical, Claude plugin, and Codex plugin copies.
  - `bun test skills/md-asks/reference/done-followups.awk.test.ts` reported `18 pass, 0 fail`.
- Scratch inline-ask smoke in `/private/tmp/md-asks-smoke-codex` passed, then the scratch directory was removed.

## Gotcha

The installed cache is stale relative to the repo copy. It is missing `reference/done-followups.awk` and `reference/done-followups.awk.test.ts`, so the installed plugin cannot currently detect human follow-ups inside `[!DONE]-` callouts even though the repo copy can.

The installed metadata also still displays `MD Asks`; the repo and `AGENTS.md` naming convention use `Markdown asks`.

## Next

Reinstall or republish `md-asks@smcllns-skills`, then rerun the installed-cache smoke, especially the DONE follow-up case.
