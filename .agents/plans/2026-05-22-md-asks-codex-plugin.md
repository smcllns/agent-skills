# Plan: md-asks Codex plugin

Status: complete; merged as PR #12 (`f34dcd3`)
Branch: `codex/md-asks-codex-plugin`
Base reviewed: `main` at `a55825a` (`feat: Skills sync workflow — canonical bare skill, derived plugin copies (#11)`)

## Current read

- PR #11 merged the canonical `skills/md-asks/` source and derived Claude plugin copy.
- `scripts/sync-skills.sh` syncs into both `claude-plugins` and `codex-plugins`.
- Sync is clean after adding `codex-plugins/md-asks/`.
- The spec harness now scans `@agent/@claude/@codex` and passes across canonical, Claude, and Codex copies.
- Root README and architecture docs now describe the bare skill, Claude plugin, and Codex plugin forms.
- PR #12 merged, local `main` fast-forwarded, and `md-asks@smcllns-skills` installed locally in Codex.

## Scope

- [x] Fix the `@` trigger test contract in canonical `skills/md-asks/`.
- [x] Rename Claude plugin root to `claude-plugins/` and update references.
- [x] Sync derived Claude copy and confirm no drift.
- [x] Add `codex-plugins/md-asks/` with `.codex-plugin/plugin.json`, README, and derived skill copy.
- [x] Add repo Codex marketplace at `.agents/plugins/marketplace.json`.
- [x] Polish Codex-facing skill/plugin UX copy without changing the protocol.
- [x] Update root docs for the three forms: bare skill, Claude plugin, Codex plugin.
- [x] Verify tests, sync drift, JSON validity, and install-facing file shape.
- [x] Merge PR #12 and verify Codex local install/discovery.

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
- `git diff --exit-code` after staging intended changes
- JSON parse for `.agents/plugins/marketplace.json` and `codex-plugins/md-asks/.codex-plugin/plugin.json`
- Manual file-shape inspection against Codex plugin docs: manifest path, relative `./skills/`, marketplace source path.
- `codex plugin marketplace add /Users/smcllns/Projects/skills`
- Codex app-server `plugin/read` reported `md-asks@smcllns-skills` installed/enabled.
- Fresh `codex debug prompt-input` included `md-asks:md-asks` from the Codex plugin cache.

## Unresolved questions

- None for PR #12. Root README refresh is next and has a handoff at `docs/handoffs/root-readme-refresh-research.md`.
