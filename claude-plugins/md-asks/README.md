# Markdown asks

A Claude plugin that resolves `@agent` asks in markdown files and records the exchange in callout threads.

Invoke it on a path; it scans, finds unresolved asks and open `[!NOTE]+` threads, and resolves them.

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
Schedule a task to run every 5 minutes that runs the md-asks skill on my notes folder at /path/to/notes.
```

Claude Cowork provides a nice UI for managing scheduled tasks and you can pause/delete there, or ask Claude if you want to run it on a different timer.

## Obsidian styling (optional)

For a nicer look in Obsidian Reading mode, the repo ships a CSS snippet at `skills/md-asks/companion/md-asks-callouts.css`. Copy it into your vault's `.obsidian/snippets/`, then enable it via Settings → Appearance → CSS snippets. Renders amber for active threads, green for resolved.

## Tests

Two test harnesses live under `skills/md-asks/reference/`:

**Spec test** — verifies the scan regex in `SKILL.md` against the fixture catalog in `markdown-agent-directives.spec.md`. Requires `bun >= 1.3`.

```bash
bun test skills/md-asks/reference/markdown-agent-directives.spec.test.ts
```

**Model comparison** — runs the skill across multiple Claude models on a graded fixture, saves each result to `reference/model-comparison/results/<model>.md` (gitignored) for eyeball comparison.

```bash
cd skills/md-asks/reference/model-comparison
./run.sh haiku-4.5 sonnet-4.6 opus-4.7
```

See `reference/model-comparison/README.md` for the rubric.

## Feedback

Please direct issues or feedback to [github.com/smcllns/skills](https://github.com/smcllns/skills)
