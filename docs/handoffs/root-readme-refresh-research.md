# Root README Refresh Research

Context: after PR #12 merged, the next PR should update the root `README.md`. This note preserves the earlier subagent synthesis so a fresh session can start from durable context.

## Pattern Notes

- Strong marketplace READMEs quickly define what the repo is, then route readers by task: install, browse catalog, contribute/package.
- Host-specific install paths should be split into clear subsections instead of buried in prose.
- A small repo should use a concise catalog table, not a giant awesome-list structure.
- Catalog rows should show installability context: skill/plugin, host support, and one plain-English use case.
- Trust notes are useful for plugin/skill marketplaces. For this repo, call out that `md-asks` reads and writes markdown files.
- Keep rich usage detail in each skill/plugin README. The root README should orient and route.

## Recommended Shape

Use a marketplace-first README:

```md
# Sam Collins Skills

Personal agent skills and host-specific plugin wrappers for Claude and Codex.

## Quick Start

### Claude Code / Cowork

### Codex

### Standalone skills

## Catalog

### Plugins

### Skills

## How This Repo Is Organized

## Safety Notes

## Contributing / Packaging Notes

## License
```

## Catalog Guidance

Use a compact table. Suggested columns:

- `Name`
- `Kind`
- `Hosts`
- `Use when`
- `Where to read more`

## Naming / Wording Cautions

- Keep `md-asks`, but always pair it with plain language: "resolve `@agent` asks in markdown files."
- Say "Claude plugin wrappers" and "Codex plugin wrappers"; the canonical implementation lives in `skills/`.
- Avoid implying host parity unless a behavior is verified in both Claude and Codex.
- Keep `bunx` in examples where this repo documents JS package execution; do not introduce `npx`.

## Next-Session Prompt

```text
Start the README refresh PR in /Users/smcllns/Projects/skills. Read docs/handoffs/root-readme-refresh-research.md, current README.md, docs/architecture.md, and the plugin/skill README files only as needed. Create a new branch for the root README update. Rewrite the root README so it has: brief intro, quick start for Claude/Codex/standalone installs, concise catalog of skills/plugins, repo organization, safety notes, feedback/license. Keep detailed usage in individual skill/plugin READMEs.
```
