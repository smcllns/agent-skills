# Plan: markdown-agent-comments (Claude plugin)

**Status: IN PROGRESS** on branch `markdown-agent-comments-plugin`. First plugin to ship from this marketplace. Picked because it's simpler than `inbox-zero-gmail` (no NUX, no state, no auth) and lets us learn the multi-form distribution pattern on easy mode before applying it to inbox-zero.

## Goal

Ship the existing `markdown-agent-comments` skill in three forms, in this order:

1. **Bare skill** — at `skills/markdown-agent-comments/`, installable via `npx skills@latest add smcllns/skills`. Synced from dotfiles ✅
2. **Claude plugin** — to create at `claude-cowork-plugins/markdown-agent-comments/`. Installable via `claude plugin marketplace add smcllns/skills` and through the Cowork UI. **Primary deliverable.**
3. **Codex plugin** — at `codex-plugins/markdown-agent-comments/`. Deferred until #2 is shipped.
4. **Obsidian plugin** — separate repo, out of scope.

## Resolved decisions

- **Plugin dir name:** `claude-cowork-plugins/markdown-agent-comments/` — **no `-claude` suffix**. Parent dir already encodes host. (Inbox-zero will be renamed to match when it ships.)
- **Tests inside plugin:** yes, copy `dev/tests/` in. (Tests have since been rewritten in bun+TS with a spec-driven format under `dev/`; internal-only assets live there.)
- **Default schedule:** none. Plugin ships the skill only. User configures triggers per-vault/per-path in Cowork.
- **Source of truth:** dotfiles is canonical. `skills/` and `claude-cowork-plugins/<plugin>/skills/` are one-way exports. Sync by hand when the skill changes. No sync script yet — write one if drift becomes painful (it won't for one skill).

## Read first

- `docs/architecture.md` — layout, decisions, terminology
- `docs/writing-claude-plugins.md` — accumulated plugin-authoring know-how. Add findings here as you work.
- `skills/markdown-agent-comments/SKILL.md` — the bare skill (canonical mirror of dotfiles, synced 2026-05-21)

## Step-by-step

### Phase 1 — Scaffold the plugin

- [ ] Create `claude-cowork-plugins/markdown-agent-comments/.claude-plugin/plugin.json` — name, description, author, keywords. Model on inbox-zero's, no hooks.
- [ ] Copy `skills/markdown-agent-comments/SKILL.md` → `claude-cowork-plugins/markdown-agent-comments/skills/markdown-agent-comments/SKILL.md`
- [ ] Copy `skills/markdown-agent-comments/dev/` → mirror path under the plugin (tests + wishlist live here, internal-only)
- [ ] Write `claude-cowork-plugins/markdown-agent-comments/README.md` — what the skill does + install paths (marketplace, Cowork UI, npx skills)
- [ ] No `hooks.json` — skill is stateless, no NUX, no config

### Phase 2 — Wire into the marketplace

- [ ] Add a plugin entry to root `.claude-plugin/marketplace.json` (currently `"plugins": []`)
- [ ] Update root `README.md` Plugins section — replace "none published yet" line with a row for `markdown-agent-comments`
- [ ] Document the resolved source-of-truth strategy in `docs/architecture.md` (dotfiles canonical, manual sync)

### Phase 3 — Verify locally

- [ ] Install plugin into Sam's Cowork via local-folder install
- [ ] Open a real markdown file with a `@human:` or `[!NOTE]+` agent comment
- [ ] Invoke the skill, confirm it lands a callout reply in place and behaves per SKILL.md
- [ ] Confirm `npx skills@latest add smcllns/skills` still installs the bare skill at the unchanged path

### Phase 4 — Verify scheduled execution (the WHY of the plugin)

- [ ] Have Sam create a Cowork scheduled task that invokes the skill on a vault path
- [ ] Watch one tick fire end-to-end and confirm it finds + resolves unresolved comments
- [ ] Capture any gotchas (path arg, env, permissions) in `docs/writing-claude-plugins.md`

### Phase 5 — Ship

- [ ] Small clean commits along the way (one per phase ideally)
- [ ] Open PR `markdown-agent-comments-plugin → main`
- [ ] Self-review for over-engineering, then merge
- [ ] Check off this plan, capture any remaining notes in `docs/writing-claude-plugins.md`

## Done criteria

- Plugin installed in Sam's Cowork
- Sam can invoke it on a real markdown file and it processes comments correctly
- Sam can drive it from a Cowork scheduled task
- Bare-skill install path (`npx skills add smcllns/skills`) still works
- Plugin listed in root README and marketplace.json
- Merged to main

## Out of scope (separate work)

- (Done as pre-ship cleanup, not in current scope) Speaker-label deferral, bun+TS spec-driven test suite, SKILL.md restructure
- Codex plugin form
- Obsidian plugin (separate repo)
- Inbox-zero plugin rename / suffix cleanup (lives on `inbox-zero` branch; revisit when shipping it)
- Refinement to the SKILL.md content beyond what's already shipped
