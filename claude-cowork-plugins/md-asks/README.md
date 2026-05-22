# md-asks

A Claude plugin that picks up inline `@claude`, `@codex`, or `@agent` asks in any markdown file — Obsidian vaults, repo docs, plain notes — does the requested edit in the document body, and wraps the exchange in a callout thread that can be continued if follow-up is needed.

Stateless. No hooks. No NUX. Drop it in and invoke it on a path; it scans, finds unresolved asks and open `[!NOTE]+` threads, and resolves them.

See `skills/md-asks/SKILL.md` for the protocol details (ask shapes, the `[!NOTE]+` / `[!DONE]-` marker convention, scan regex, discussion thread format).

## Install

**Via the marketplace (Claude Code or Cowork):**

```bash
claude plugin marketplace add smcllns/skills
```

Then from within Claude Code or Cowork:

```bash
/plugin install md-asks@smcllns-skills
```

## Usage

### Manual usage

In **Claude Cowork** on desktop, set the folder you can explicitly type the skill to trigger it

```text
/md-asks
```

or more simply ask claude in plain speak like `resolve md asks` and it'll invoke the skill.

### Scheduled usage

In **Claude Cowork** on desktop, you can type something like the following to run it on a schedule.

```plaintext
Schedule a task to run every 5 minutes that runs the md-asks skill on my obsidian vault at ~/Projects/obsidian.
```

Claude Cowork provides a nice UI for managing scheduled tasks and you can pause/delete there, or ask Claude if you want to run it on a different timer.

## Migration from `#`-prefix

The original syntax used `#claude` / `#codex` / `#agent`. This collided with Obsidian's native `#tag` system, so the plugin now uses `@`-prefix instead. To migrate an existing vault, flip unresolved asks with perl. The substitution skips `>`-blockquote lines, so already-resolved `[!DONE]-` callouts keep their original `#`-prefix ask preserved verbatim.

```sh
# Dry-run: show lines that would change
find ~/Projects/obsidian -name '*.md' -print0 | xargs -0 perl -ne 'print "$ARGV:$.: $_" if !/^\s*>/ && /(^|\s)\#(claude|codex|agent)\b/'

# Apply
find ~/Projects/obsidian -name '*.md' -print0 | xargs -0 perl -i -pe 's/(^|\s)\#(claude|codex|agent)\b/$1\@$2/g unless /^\s*>/'
```

Adjust the path and trigger list to match your vault.

## Obsidian styling (optional)

For a nicer look in Obsidian Reading mode, the repo ships a CSS snippet at `companion/agent-callouts.css`. Copy it into your vault's `.obsidian/snippets/`, then enable it via Settings → Appearance → CSS snippets. Renders amber for active threads, green for resolved.

## Feedback

Please direct issues or feedback to [github.com/smcllns/skills](https://github.com/smcllns/skills)
