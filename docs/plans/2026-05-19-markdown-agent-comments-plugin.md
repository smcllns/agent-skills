# Plan: markdown-agent-comments (Claude plugin)

**Status: NEXT UP.** First plugin to ship from this marketplace. Picked because it's simpler than `inbox-zero-gmail` (no NUX, no state, no auth) and lets us learn the multi-form distribution pattern on easy mode before applying it to inbox-zero.

## Goal

Ship the existing `markdown-agent-comments` skill in three forms, in this order:

1. **Bare skill** — already at `skills/markdown-agent-comments/`, installable via `npx skills@latest add smcllns/skills`. Needs refresh (see source-of-truth note below).
2. **Claude plugin** — to create at `claude-cowork-plugins/markdown-agent-comments/`. Installable via `claude plugin marketplace add smcllns/skills` and through the Cowork UI. **This is the primary deliverable for this plan.**
3. **Codex plugin** — at `codex-plugins/markdown-agent-comments/`. Deferred until #2 is shipped and we've learned what Codex actually needs.
4. **Obsidian plugin** — separate repo, out of scope here.

## Why this skill first

| Property | markdown-agent-comments | inbox-zero-gmail |
|---|---|---|
| Needs new-user experience | No | Yes (custom policy.md) |
| Needs durable state | No | Yes (policy.md, log.jsonl) |
| Needs connector permissions | No | Yes (Gmail label-write) |
| Wants auto-learn loop | No | Yes (later) |
| Lines of SKILL.md | ~150 | ~50 (after v3 rewrite) but with references/ |

Shipping this first forces us to solve: marketplace install path, plugin manifest format, Cowork UI install flow, scheduled execution (Cowork's scheduling skill), and `npx skills` interaction with the new repo layout. None of those are skill-specific.

## Read first

- `docs/architecture.md` — the layout, decisions, terminology
- `docs/writing-claude-plugins.md` — **accumulated know-how about authoring plugins** (gotchas, schema, hooks, persistence, install/uninstall, what's verified vs not). Add findings here as you work.
- `~/Projects/obsidian/scratch/Figured out single repo architecture for public skills and plugins - v3.md` — decision history
- `skills/markdown-agent-comments/SKILL.md` — the skill content as it stands in this repo
- `~/Projects/dotfiles/skills/markdown-agent-comments/SKILL.md` — the active daily-driver version; slightly newer (May 19 23:56 vs the repo's May 19 23:00). Diff before assuming the repo copy is current.

## Source-of-truth tension to resolve

`skills/markdown-agent-comments/SKILL.md` (the public bare skill) and `~/Projects/dotfiles/skills/markdown-agent-comments/SKILL.md` (Sam's daily-driver) are two copies of the same idea, and they have already drifted by one edit. Once the plugin form exists at `claude-cowork-plugins/markdown-agent-comments/skills/markdown-agent-comments/SKILL.md`, there will be three copies.

**Decide on a strategy before writing the plugin SKILL.md.** Three options:

1. **Public repo is canonical, dotfiles is a consumer.** Sam's machine pulls from the public repo. One source. Cleanest, but requires Sam to install the public skill into his daily workflow.
2. **Dotfiles is canonical, public repo + plugin are exports.** A script (or commit-time hook) syncs `dotfiles → skills/<name>/SKILL.md → claude-cowork-plugins/<name>/skills/<name>/SKILL.md`. Adds machinery but matches reality (Sam edits in dotfiles).
3. **Three independent copies, sync by hand.** Cheapest, drifts fastest. Acceptable if edits are rare; bad if frequent.

The architecture doc says "no symlinks, manual sync, introduce a build step only if drift becomes painful." Pick one for this work and write it down.

## Scope of this plan

In rough order:

- [ ] Diff `skills/markdown-agent-comments/SKILL.md` against the dotfiles version. Decide which is correct. Sync them per the resolved source-of-truth strategy.
- [ ] Pick a source-of-truth strategy (see above), write the decision into `docs/architecture.md`.
- [ ] Refine SKILL.md if needed — Sam's quality bar: "does the job, handles unknowns well, user-agent interactions are appropriate." Read the SKILL.md carefully and look for thin spots; ask Sam.
- [ ] Scaffold `claude-cowork-plugins/markdown-agent-comments/`:
   - `.claude-plugin/plugin.json`
   - `skills/markdown-agent-comments/SKILL.md` (synced from bare skill per chosen strategy)
   - `skills/markdown-agent-comments/tests/` if useful inside the plugin
   - `README.md`
   - No hooks needed (skill is stateless)
- [ ] Add this plugin to the root `.claude-plugin/marketplace.json` (sibling entry to `inbox-zero-gmail-claude`).
- [ ] Update repo `README.md` to list the new plugin.
- [ ] Smoke test: install the plugin locally in Cowork (via local-folder install), run on a sample markdown file with comments, verify the skill triggers and processes correctly.
- [ ] Confirm Cowork's scheduling skill can drive it (the SKILL should be invocable as a scheduled task — verify with Cowork's `mcp__scheduled-tasks__create_scheduled_task`).
- [ ] Confirm `npx skills@latest add smcllns/skills` finds the bare skill at the new path. If the CLI expects a fixed `skills/` subdir layout, we're already there.
- [ ] Commit and push to the `smcllns/skills` remote.
- [ ] (Stretch) Install via the marketplace install path and verify it works end-to-end without the local-folder shortcut.

## Open questions for the agent picking this up

- **Plugin name and dir name.** Late Breaking layout shows `claude-cowork-plugins/markdown-agent-comments/` — no `-claude` suffix. The inbox-zero plugin currently has `inbox-zero-gmail-claude`. Either both have the suffix or neither does. Recommend dropping the suffix on both (parent dir already encodes the host). Confirm with Sam before renaming inbox-zero.
- **Tests inside the plugin?** Bare skill has `tests/find-unresolved.test.sh`. Should the plugin copy include it (probably yes, useful for users) or strip it (probably no, no reason)?
- **Scheduled triage by default?** Should the plugin ship with any default schedule, or just be invocable on demand? Sam mentioned "running effectively on a schedule via Cowork" as a goal — but how often, and over what scope (a single vault? any open markdown? a configured path)? Likely needs a small piece of plugin-level config — but maybe deferred to v0.1.

## Done criteria

- The plugin is installed in Sam's Cowork
- Sam can invoke it on a real markdown file with comments and the agent processes them correctly
- Sam can schedule it via Cowork's scheduling skill
- The bare-skill install path (`npx skills add smcllns/skills`) still works
- Commit pushed, branch is `main`, repo README lists the new plugin

## What this plan does NOT cover

- The Codex plugin (`codex-plugins/markdown-agent-comments/`) — separate plan once Codex tooling is concrete
- The Obsidian plugin — separate repo
- Any further refinement to the skill beyond "ships clean"
