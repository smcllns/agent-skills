# markdown-agent-directives

A Claude plugin that picks up inline `#claude`, `#codex`, or `#agent` directives in any markdown file — Obsidian vaults, repo docs, plain notes — does the requested edit in the document body, and wraps the exchange in a callout thread that can be continued if follow-up is needed.

Stateless. No hooks. No NUX. Drop it in and invoke it on a path; it scans, finds unresolved directives and open `[!NOTE]+` threads, and resolves them.

See `skills/markdown-agent-directives/SKILL.md` for the protocol details (directive shapes, the `[!NOTE]+` / `[!DONE]-` marker convention, scan regex, discussion thread format).

## Install

**Via the marketplace (Claude Code or Cowork):**

```bash
claude plugin marketplace add smcllns/skills
```

Then from within Claude Code or Cowork:

```bash
/plugin install markdown-agent-directives@smcllns-skills
```

**As a bare skill (no plugin runtime):**

```bash
npx skills@latest add smcllns/skills
```

## Usage

Drive it from a Cowork scheduled task pointed at a vault path, or invoke it manually on a directory or single file. 

The skill finds files containing unresolved directives, processes them per `SKILL.md`'s resolution contract, and leaves a clean callout trail.
