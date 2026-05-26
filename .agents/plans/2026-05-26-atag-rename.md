# Markdown Agent Tags rename plan

## Scope

- [x] Store the `atag` naming contract in `docs/naming/atag.md`.
- [x] Update `AGENTS.md` so future agents follow the new naming contract.
- [x] Write this implementation plan.
- [x] Rename canonical skill/package surface to `atag`.
- [x] Rename Claude and Codex plugin packages to `atag`.
- [x] Update tests, fixtures, docs, and marketplace metadata.
- [x] Sync derived plugin skill copies.
- [x] Run regression tests and sync-drift checks.
- [x] Update PR #27 for final implementation review.

## Execution decisions

- New resolved threads use `<!--atag:eot-->`.
- No pre-rename seal compatibility is kept; the seal was introduced the same day as the rename, so `<!--atag:eot-->` is the only supported seal.
- Rename the syntax-contract fixture files to `markdown-agent-tags.*`.
- Remove old-name discoverability docs so repository text search has no lingering references.
- Use `atag@smcllns-skills` as the marketplace install target. This repo does not ship an npm package for `@smcllns/atag`.
- Do not keep deprecated plugin entries in marketplace manifests.

## Rename steps

- [x] Rename canonical skill directory to `skills/atag/`.
- [x] Rename Claude plugin directory to `claude-plugins/atag/`.
- [x] Rename Codex plugin directory to `codex-plugins/atag/`.
- [x] Update skill frontmatter: `name: atag`, heading `# Markdown Agent Tags`, description using first-mention wording.
- [x] Use short description phrase "agent tags in markdown" for package descriptions and README blurbs.
- [x] Update plugin manifests:
  - `.claude-plugin/marketplace.json`
  - `.agents/plugins/marketplace.json`
  - `claude-plugins/atag/.claude-plugin/plugin.json`
  - `codex-plugins/atag/.codex-plugin/plugin.json`
- [x] Update root README catalog, install commands, plugin links, and repo organization.
- [x] Update `docs/architecture.md` layout and plugin naming examples.
- [x] Update `docs/wishlist.md` if the content still applies; rename or retire if obsolete.
- [x] Rename companion CSS to `atag-callouts.css`.
- [x] Rename CSS custom properties to `--atag-*`.
- [x] Update model comparison docs/scripts to say `atag` and "tags".
- [x] Remove old-name discoverability docs after the zero-lingering-reference review.

## Test and protocol steps

- [x] Decide that protocol markers use `<!--atag:eot-->`.
- [x] Document that `<!--atag:eot-->` is the only supported seal.
- [x] Rename spec and test files to use the Markdown Agent Tags formal name.
- [x] Update constants, temp prefixes, fixtures, and expected strings in the Bun tests.
- [x] Run `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts`.
- [x] Run `scripts/sync-skills.sh`.
- [x] Run `diff -qr skills/atag claude-plugins/atag/skills/atag` and `diff -qr skills/atag codex-plugins/atag/skills/atag` after sync.
- [x] Run stale-name grep and resolve remaining hits.

## PR checks

- [x] Verify no generated plugin copy drift remains.
- [x] Verify all install examples use `atag`.
- [x] Verify user-facing prose says "`@agent` tag" or "tag", not "an atag".
- [x] Verify no old-name references remain in public docs/manifests.
- [x] Run local critical review for over-broad rename fallout before final PR push.

## Open questions

- None.
