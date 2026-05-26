# Markdown Agent Tags rename plan

## Scope

- [x] Store the `atag` naming contract in `docs/naming/atag.md`.
- [x] Update `AGENTS.md` so future agents follow the new naming contract.
- [x] Write this implementation plan.
- [ ] Rename canonical skill/package surface from `md-asks` to `atag`.
- [ ] Rename Claude and Codex plugin packages from `md-asks` to `atag`.
- [ ] Update tests, fixtures, docs, and marketplace metadata.
- [ ] Sync derived plugin skill copies.
- [ ] Run regression tests and sync-drift checks.
- [ ] Publish implementation PR after Sam reviews this plan.

## Execution decisions

- New resolved threads use `<!--atag:eot-->`.
- Existing `<!--md-asks:eot-->` seals stay recognized by the DONE scan so old resolved threads do not reopen during migration.
- Rename the syntax-contract fixture files from `markdown-agent-directives.*` to `markdown-agent-tags.*`.
- Keep an old-name redirect doc so `md-asks` searches point to `atag`.

## Rename steps

- [ ] Rename `skills/md-asks/` to `skills/atag/`.
- [ ] Rename `claude-plugins/md-asks/` to `claude-plugins/atag/`.
- [ ] Rename `codex-plugins/md-asks/` to `codex-plugins/atag/`.
- [ ] Update skill frontmatter: `name: atag`, heading `# Markdown Agent Tags`, description using first-mention wording.
- [ ] Use short description phrase "agent tags in markdown" for package descriptions and README blurbs.
- [ ] Update plugin manifests:
  - `.claude-plugin/marketplace.json`
  - `.agents/plugins/marketplace.json`
  - `claude-plugins/atag/.claude-plugin/plugin.json`
  - `codex-plugins/atag/.codex-plugin/plugin.json`
- [ ] Update root README catalog, install commands, plugin links, and repo organization.
- [ ] Update `docs/architecture.md` layout and plugin naming examples.
- [ ] Update `docs/wishlist.md` if the content still applies; rename or retire if obsolete.
- [ ] Rename companion CSS from `md-asks-callouts.css` to `atag-callouts.css`.
- [ ] Rename CSS custom properties from `--md-asks-*` to `--atag-*`.
- [ ] Update model comparison docs/scripts to say `atag` and "tags" rather than "md-asks".
- [ ] Add old-name discoverability: either `docs/naming/md-asks.md` redirecting to `docs/naming/atag.md`, or a README alias note that points old `md-asks` searches to `atag`.

## Test and protocol steps

- [ ] Decide whether protocol markers rename from `<!--md-asks:eot-->` to `<!--atag:eot-->`.
- [ ] If markers rename, add backward-compatibility tests or intentionally document the migration break.
- [ ] Rename `reference/markdown-agent-directives.spec.md` and test file only if "Markdown Agent Tags" should replace the old internal spec codename.
- [ ] Update constants, temp prefixes, fixtures, and expected strings in the Bun tests.
- [ ] Run `bun test skills/atag/reference/*.test.ts`.
- [ ] Run `scripts/sync-skills.sh`.
- [ ] Run `git diff --exit-code -- claude-plugins/atag/skills/atag codex-plugins/atag/skills/atag` after sync.
- [ ] Run canonical stale-name grep and resolve or explicitly justify remaining hits.

## Canonical stale-name grep

```bash
rg -n "md-asks|Markdown asks|MD Asks|markdown-agent-asks|agent asks in markdown|md asks|markdown-agent-directives|ATAG|Atag|atags" .
```

## PR checks

- [ ] Verify no generated plugin copy drift remains.
- [ ] Verify all install examples use `atag`.
- [ ] Verify user-facing prose says "`@agent` tag" or "tag", not "an atag".
- [ ] Verify old-name searches point users to `atag` before deleting all `md-asks` docs references.
- [ ] Have a critical reviewer check for over-broad rename fallout before opening the implementation PR.

## Open questions

- Is the package target `@smcllns/atag`, bare `atag`, or both across different package managers?
- Should old `md-asks` plugin entries stay as deprecated shims for one release?
