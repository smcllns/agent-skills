# Plan: markdown-agent-directives (Claude plugin)

**Status: SHIPPED** 2026-05-22 via [PR #8](https://github.com/smcllns/skills/pull/8). Dotfiles synced via [PR #95](https://github.com/AtipicalLabs/dotfiles/pull/95). 5-min scheduled task running in Cowork. First plugin to ship from this marketplace. Picked because it's simpler than `inbox-zero-gmail` (no NUX, no state, no auth) and let us learn the multi-form distribution pattern on easy mode before applying it to inbox-zero.

## Goal

Ship the existing `markdown-agent-directives` skill in three forms, in this order:

1. **Bare skill** — at `skills/markdown-agent-directives/`, installable via `bunx skills@latest add smcllns/skills`. Synced from dotfiles ✅
2. **Claude plugin** — to create at `claude-plugins/markdown-agent-directives/`. Installable via `claude plugin marketplace add smcllns/skills` and through the Cowork UI. **Primary deliverable.**
3. **Codex plugin** — at `codex-plugins/markdown-agent-directives/`. Deferred until #2 is shipped.
4. **Obsidian plugin** — separate repo, out of scope.

## Resolved decisions

- **Plugin dir name:** `claude-plugins/markdown-agent-directives/` — **no `-claude` suffix**. Parent dir already encodes host. (Inbox-zero will be renamed to match when it ships.)
- **Tests inside plugin:** yes, copy `reference/` in. (Tests rewritten in bun+TS with a spec-driven format; internal-only assets all live under `reference/`.)
- **Default schedule:** none. Plugin ships the skill only. User configures triggers per-vault/per-path in Cowork.
- **Source of truth:** dotfiles is canonical. `skills/` and `claude-plugins/<plugin>/skills/` are one-way exports. Sync by hand when the skill changes. No sync script yet — write one if drift becomes painful (it won't for one skill).

## Read first

- `docs/architecture.md` — layout, decisions, terminology
- `docs/writing-claude-plugins.md` — accumulated plugin-authoring know-how. Add findings here as you work.
- `skills/markdown-agent-directives/SKILL.md` — the bare skill (canonical mirror of dotfiles, synced 2026-05-21)

## Step-by-step

### Phase 1 — Scaffold the plugin

- [x] Create `claude-plugins/markdown-agent-directives/.claude-plugin/plugin.json` — name, description, author, keywords. Model on inbox-zero's, no hooks.
- [x] Copy `skills/markdown-agent-directives/SKILL.md` → `claude-plugins/markdown-agent-directives/skills/markdown-agent-directives/SKILL.md`
- [x] Copy `skills/markdown-agent-directives/reference/` → mirror path under the plugin (tests + wishlist live here, internal-only)
- [x] Write `claude-plugins/markdown-agent-directives/README.md` — what the skill does + install paths (marketplace, Cowork UI, bunx skills)
- [x] No `hooks.json` — skill is stateless, no NUX, no config

### Phase 2 — Wire into the marketplace

- [x] Add a plugin entry to root `.claude-plugin/marketplace.json` (currently `"plugins": []`)
- [x] Update root `README.md` Plugins section — replace "none published yet" line with a row for `markdown-agent-directives`
- [x] Document the resolved source-of-truth strategy in `docs/architecture.md` (dotfiles canonical, manual sync)

### Phase 3 — Verify locally

- [x] Install plugin into Sam's Cowork via local-folder install
- [x] Open a real markdown file with a `#claude` (or `#agent`) directive
- [x] Invoke the skill, confirm it actions the directive and wraps it in a callout per SKILL.md
- [x] Confirm `bunx skills@latest add smcllns/skills` still installs the bare skill at the unchanged path

### Phase 4 — Verify scheduled execution (the WHY of the plugin)

- [x] Have Sam create a Cowork scheduled task that invokes the skill on a vault path
- [x] Watch one tick fire end-to-end and confirm it finds + resolves unresolved comments
- [x] Capture any gotchas (path arg, env, permissions) in `docs/writing-claude-plugins.md`

### Phase 5 — Ship

- [x] Small clean commits along the way (one per phase ideally)
- [x] Open PR `markdown-agent-directives-plugin → main`
- [x] Self-review for over-engineering, then merge
- [x] Check off this plan, capture any remaining notes in `docs/writing-claude-plugins.md`

## Done criteria

- Plugin installed in Sam's Cowork
- Sam can invoke it on a real markdown file and it processes comments correctly
- Sam can drive it from a Cowork scheduled task
- Bare-skill install path (`bunx skills add smcllns/skills`) still works
- Plugin listed in root README and marketplace.json
- Merged to main

## Out of scope (separate work)

- (Done as pre-ship cleanup, not in current scope) Speaker-label deferral, bun+TS spec-driven test suite, SKILL.md restructure (Sam-authored), scope narrowing to directives-only (renamed from `markdown-agent-comments`), marker-as-protocol simplification (`[!NOTE]+` and `[!DONE]-` are the only protocol states; bare/other-marker callouts are plain markdown)
- Codex plugin form
- Obsidian plugin (separate repo)
- Inbox-zero plugin rename / suffix cleanup (lives on `inbox-zero` branch; revisit when shipping it)
- Refinement to the SKILL.md content beyond what's already shipped
