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

## Usage

### Manual usage

In **Claude Cowork** on desktop, set the folder you can explicitly type the skill to trigger it 

```text
/markdown-agent-directives
``` 

or more simply ask claude in plain speak like `resolve md directives` and it'll invoke the skill.

### Scheduled usage

In **Claude Cowork** on desktop, you can type something like the following to run it on a schedule.

```plaintext
Schedule a task to run every 5 minutes that runs the markdown-agent-directives skill on my obsidian vault at ~/Projects/obsidian.
```

Claude Cowork provides a nice UI for managing scheduled tasks and you can pause/delete there, or ask Claude if you want to run it on a different timer.

## Feedback

Please direct issues or feedback to [github.com/smcllns/skills](https://github.com/smcllns/skills)