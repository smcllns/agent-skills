# Plan: md-asks Codex plugin

Status: in progress
Branch: `codex/md-asks-codex-plugin`
Base reviewed: `main` at `a55825a` (`feat: Skills sync workflow — canonical bare skill, derived plugin copies (#11)`)

## Current read

- PR #11 merged the canonical `skills/md-asks/` source and derived Claude plugin copy.
- `scripts/sync-skills.sh` already syncs into both the current Claude plugin directory and future `codex-plugins`.
- Sync is clean: running `scripts/sync-skills.sh` produced no repo diff.
- The spec harness is red: `markdown-agent-directives.spec.test.ts` still scans `#agent/#claude/#codex`, while `SKILL.md` and fixtures now use `@agent/@claude/@codex`.
- Root README and architecture docs still have some stale `markdown-agent-directives` / `#claude` wording.

## Scope

- [x] Fix the `@` trigger test contract in canonical `skills/md-asks/`.
- [x] Rename Claude plugin root to `claude-plugins/` and update references.
- [x] Sync derived Claude copy and confirm no drift.
- [ ] Add `codex-plugins/md-asks/` with `.codex-plugin/plugin.json`, README, and derived skill copy.
- [ ] Add repo Codex marketplace at `.agents/plugins/marketplace.json`.
- [ ] Polish Codex-facing skill/plugin UX copy without changing the protocol.
- [ ] Update root docs for the three forms: bare skill, Claude plugin, Codex plugin.
- [ ] Verify tests, sync drift, JSON validity, and install-facing file shape.

## Non-scope

- No hooks, MCP server, app connector, auth, scheduler, or state directory.
- No protocol redesign beyond fixing stale `#` test references.
- No support for legacy unresolved `#claude` asks.
- No generated wrappers unless the simple copied-skill layout proves insufficient.

## Proposed file shape

```text
.agents/plugins/marketplace.json
codex-plugins/md-asks/
  .codex-plugin/plugin.json
  README.md
  skills/md-asks/...
```

## Verification

- `bun test skills/md-asks/reference/markdown-agent-directives.spec.test.ts`
- `scripts/sync-skills.sh`
- `git diff --exit-code`
- JSON parse for `.agents/plugins/marketplace.json` and `codex-plugins/md-asks/.codex-plugin/plugin.json`
- Manual file-shape inspection against Codex plugin docs: manifest path, relative `./skills/`, marketplace source path.

## Unresolved questions

- None before implementation. If Codex refuses a repo marketplace path during manual verification, revisit marketplace path conventions then.
