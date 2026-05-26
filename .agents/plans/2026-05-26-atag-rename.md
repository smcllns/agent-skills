# Markdown Agent Tags rename plan

## Scope

- [x] Store the `atag` naming contract in `docs/naming/atag.md`.
- [x] Update `AGENTS.md` so future agents follow the new naming contract.
- [x] Write this implementation plan.
- [x] Rename canonical skill/package surface from `md-asks` to `atag`.
- [x] Rename Claude and Codex plugin packages from `md-asks` to `atag`.
- [x] Update tests, fixtures, docs, and marketplace metadata.
- [x] Sync derived plugin skill copies.
- [x] Run regression tests and sync-drift checks.
- [x] Update PR #27 for final implementation review.

## Execution decisions

- New resolved threads use `<!--atag:eot-->`.
- No legacy `<!--md-asks:eot-->` compatibility is kept; the seal was introduced the same day as the rename, so `<!--atag:eot-->` is the only supported seal.
- Rename the syntax-contract fixture files from `markdown-agent-directives.*` to `markdown-agent-tags.*`.
- Keep an old-name redirect doc so `md-asks` searches point to `atag`.
- Use `atag@smcllns-skills` as the marketplace install target. This repo does not ship an npm package for `@smcllns/atag`.
- Do not keep deprecated `md-asks` plugin entries in marketplace manifests; the redirect doc is the old-name discovery path.

## Rename steps

- [x] Rename `skills/md-asks/` to `skills/atag/`.
- [x] Rename `claude-plugins/md-asks/` to `claude-plugins/atag/`.
- [x] Rename `codex-plugins/md-asks/` to `codex-plugins/atag/`.
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
- [x] Rename companion CSS from `md-asks-callouts.css` to `atag-callouts.css`.
- [x] Rename CSS custom properties from `--md-asks-*` to `--atag-*`.
- [x] Update model comparison docs/scripts to say `atag` and "tags" rather than "md-asks".
- [x] Add old-name discoverability via `docs/naming/md-asks.md`.

## Test and protocol steps

- [x] Decide whether protocol markers rename from `<!--md-asks:eot-->` to `<!--atag:eot-->`.
- [x] Document that `<!--atag:eot-->` is the only supported seal.
- [x] Rename `reference/markdown-agent-directives.spec.md` and test file only if "Markdown Agent Tags" should replace the old internal spec codename.
- [x] Update constants, temp prefixes, fixtures, and expected strings in the Bun tests.
- [x] Run `bun test skills/atag/reference/markdown-agent-tags.spec.test.ts`.
- [x] Run `scripts/sync-skills.sh`.
- [x] Run `diff -qr skills/atag claude-plugins/atag/skills/atag` and `diff -qr skills/atag codex-plugins/atag/skills/atag` after sync.
- [x] Run canonical stale-name grep and resolve or explicitly justify remaining hits.

## Canonical stale-name grep

```bash
rg -n --hidden --glob '!.git/**' "md-asks|Markdown asks|MD Asks|markdown-agent-asks|agent asks in markdown|md asks|markdown-agent-directives|\"asks\"|\"directives\"|ATAG|Atag|atags" .
```

## PR checks

- [x] Verify no generated plugin copy drift remains.
- [x] Verify all install examples use `atag`.
- [x] Verify user-facing prose says "`@agent` tag" or "tag", not "an atag".
- [x] Verify old-name searches point users to `atag` before deleting all `md-asks` docs references.
- [x] Run local critical review for over-broad rename fallout before final PR push.

## Open questions

- None.
