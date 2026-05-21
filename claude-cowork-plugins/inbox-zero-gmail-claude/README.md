# inbox-zero-gmail

Triage a Gmail inbox to zero on every pass — categorize, label, archive. Drafts replies on request; **never sends and never deletes.** Reads the user's personal policy for labels, sender rules, and what counts as actionable, then bulk-handles obvious patterns and hand-classifies the long tail. Hands back a short HTML report with anything that needs attention and anything it was unsure about.

## Install

This skill is packaged as a plugin in the `smcllns-skills` marketplace and as a standalone skill consumable via the npx skills CLI.

```bash
# Claude Code CLI — install via marketplace
claude plugin marketplace add smcllns/skills
/plugin install inbox-zero-gmail@smcllns-skills

# Claude Cowork — install via the in-app marketplace UI (point at smcllns/skills)

# Standalone skill (any host) — install via npx
npx skills@latest add smcllns/skills

# Codex — wrapper coming soon
```

On first run, a SessionStart hook seeds `${CLAUDE_PLUGIN_DATA}/policy.md` from `user/policy.example.md`. Edit that file to customize labels, sender rules, and newsletters you actually read.

## Files

- `SKILL.md` — the canonical skill body (the triage loop, classification rules, report shape).
- `references/setup.md` — first-time Gmail-connector setup and policy customization.
- `references/correction-log.md` — schema for the append-only correction log at `${CLAUDE_PLUGIN_DATA}/log.jsonl`.
- `references/transport-cowork.md` — Cowork-specific Gmail tool surface, rendering, and persistence notes.
- `user/policy.example.md` — starter template for the user's personal policy.
- `plugins/claude-cowork/` — the Claude / Cowork plugin wrapper; its `skills/inbox-zero-gmail/` contents are symlinks back to the canonical files above.

## Privacy

The plugin ships only `policy.example.md`. The user's real `policy.md` and `log.jsonl` live in `${CLAUDE_PLUGIN_DATA}` at runtime and are never published.
