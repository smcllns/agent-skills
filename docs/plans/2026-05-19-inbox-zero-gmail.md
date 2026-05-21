# Plan: inbox-zero-gmail (Claude plugin)

**Status: PARKED 2026-05-19.** Resuming after `markdown-agent-comments` plugin ships.

## Goal

Ship `inbox-zero-gmail` in three forms:

1. A bare skill at `skills/inbox-zero-gmail/` (does not exist yet)
2. A Claude plugin at `claude-cowork-plugins/inbox-zero-gmail-claude/` (partial scaffold exists)
3. A Codex plugin at `codex-plugins/inbox-zero-gmail-codex/` (not started)

The skill triages a Gmail inbox to zero per the user's policy — categorize, label, archive, draft replies on request. Never sends, never deletes.

## Why parked

`inbox-zero-gmail` is harder than `markdown-agent-comments`:

- Needs new-user experience (policy.md customization on first run)
- Needs durable state (`policy.md`, `log.jsonl` in `${CLAUDE_PLUGIN_DATA}`)
- Needs Gmail connector setup + label-write permissions
- Wants a correction-capture / auto-learn loop (v0.x)

We're shipping `markdown-agent-comments` first to learn the multi-form distribution pattern (bare skill + plugin + future variants) on a simpler skill. Then we apply what we learned to inbox-zero.

## Decisions locked in

Read first:
- `docs/architecture.md` — the layout, decisions, terminology
- `docs/writing-claude-plugins.md` — accumulated know-how about authoring plugins
- `~/Projects/obsidian/scratch/Figured out single repo architecture for public skills and plugins - v3.md` — decision history

Key points:

- **No symlinks.** Bare skill copy and plugin's embedded copy are independently maintained for now.
- **No lift-and-shift from `~/Projects/dotfiles/skills/inbox-zero/`.** v3 SKILL.md and policy.example.md to be written from scratch against what the new Cowork plugin runtime actually exposes.
- **Persistence via `${CLAUDE_PLUGIN_DATA}`.** Plugin ships `policy.example.md` only. SessionStart hook seeds `${CLAUDE_PLUGIN_DATA}/policy.md` from the example on first run.
- **No `user/` directory in the repo.** All runtime state lives in `${CLAUDE_PLUGIN_DATA}`.
- **v0 scope: triage + report.** No correction logging or auto-learn loop in v0. Capture is a follow-on.

## Current state on disk

```
claude-cowork-plugins/inbox-zero-gmail-claude/
├── .claude-plugin/plugin.json        ← STALE: name still "inbox-zero-gmail" (needs "-claude")
├── hooks/hooks.json                  ← Path updated, references policy.example.md
├── skills/inbox-zero-gmail/
│   ├── SKILL.md                      ← STALE lift-and-shift, slated for v3 rewrite
│   └── references/
│       ├── policy.example.md         ← STALE lift-and-shift, slated for v3 rewrite
│       └── setup.md                  ← STALE; may fold into SKILL.md or drop
└── README.md                         ← STALE lift-and-shift
```

The `skills/inbox-zero-gmail/` bare skill directory **does not exist yet** — Sam's Late Breaking layout reserves the slot. Create when the v3 rewrite happens.

## To-do on resume

In rough order:

- [ ] Decide whether to drop the `-claude` suffix in the plugin dir name (see `docs/architecture.md` open question)
- [ ] Rewrite `SKILL.md` from scratch against what the Cowork plugin runtime exposes — not from dotfiles
- [ ] Rewrite `policy.example.md` from scratch — minimal starter
- [ ] Decide fate of `references/setup.md` (keep / fold into SKILL.md / drop)
- [ ] Update `plugin.json` `name` field to match the final plugin dir name
- [ ] Update plugin's `README.md`
- [ ] Create the bare skill copy at `skills/inbox-zero-gmail/`
- [ ] Smoke-test SessionStart hook: install plugin → verify `${CLAUDE_PLUGIN_DATA}/policy.md` appears
- [ ] Run first triage end-to-end in Cowork
- [ ] Update repo `README.md` to list the plugin
- [ ] (Later) Correction-capture loop
- [ ] (Later) Codex wrapper

## Resume checklist

When picking this back up:

1. Read `docs/architecture.md` and the scratch doc above
2. Read this plan
3. Read `~/Projects/dotfiles/skills/inbox-zero/SKILL.md` only for reference, NOT to copy from
4. Look at what `markdown-agent-comments` shipped as — that's the pattern to follow
5. Resume at the first unchecked to-do above

## Open questions

- Source-of-truth: should the bare skill at `skills/inbox-zero-gmail/SKILL.md` and the plugin's `claude-cowork-plugins/inbox-zero-gmail-claude/skills/inbox-zero-gmail/SKILL.md` be identical? If yes, how do we prevent drift (manual, build step, or accept divergence)?
- Plugin naming: keep `inbox-zero-gmail-claude` or drop suffix to `inbox-zero-gmail` (since parent dir already encodes host)?
- `claude-cowork-plugins/` directory name: accurate but verbose — these plugins work in both Cowork and Claude Code CLI. Consider `claude-plugins/` instead.
