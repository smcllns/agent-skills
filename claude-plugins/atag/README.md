# Markdown Agent Tags

**Markdown Agent Tags** (`atag`) lets you leave `@agent` tags in markdown files for an AI agent to pick up asynchronously.

Invoke it on a path; it scans, finds unresolved tags and open `[!NOTE]+` threads, and resolves them.

See `skills/atag/SKILL.md` for the protocol details (tag shapes, the `[!NOTE]+` / `[!DONE]-` marker convention, scan regex, discussion thread format).

## Install

**Via the marketplace (Claude Code or Cowork):**

```bash
claude plugin marketplace add smcllns/skills
```

Then from within Claude Code or Cowork:

```bash
/plugin install atag@smcllns-skills
```

## Usage

### Manual usage

In **Claude Cowork** on desktop, set the folder you can explicitly type the skill to trigger it

```text
Use atag on /path/to/notes
```

or more simply ask Claude in plain speak like `resolve @agent tags` and it'll invoke the skill.

### Scheduled usage

In **Claude Cowork** on desktop, you can type something like the following to run it on a schedule.

```plaintext
Schedule a task to run every 5 minutes that runs the atag skill on my notes folder at /path/to/notes.
```

Claude Cowork provides a nice UI for managing scheduled tasks and you can pause/delete there, or ask Claude if you want to run it on a different timer.

### Terminal polling

For technical local use, run the foreground poller from a terminal. It scans every 60 seconds, prints a startup line with the watched triggers and path, then stays quiet when there is no work unless `--debug` is set. It only invokes Claude for actionable inline tags, unsealed `[!DONE]-` follow-ups, or `[!NOTE]+` threads where the human replied after the agent yielded. Closing the terminal or pressing `Ctrl-C` stops the loop.

```bash
skills/atag/scripts/atag-poll.sh --dir /path/to/notes
```

Custom triggers replace the defaults:

```bash
skills/atag/scripts/atag-poll.sh --dir /path/to/notes @pi
skills/atag/scripts/atag-poll.sh --debug --dir /path/to/notes '@agento, @pi'
```

Pass regular Claude CLI args after `--`:

```bash
skills/atag/scripts/atag-poll.sh --dir /path/to/notes -- --effort medium --max-budget-usd 1
```

The poller defaults to `--effort low` for fast mechanical tag sweeps; pass Claude CLI args after `--` to override it. Use `--response-style terminal` or `--response-style markdown` to force Claude's final output style. The default `auto` uses terminal plain text for interactive terminals and Markdown for piped/redirected callers.

## Obsidian styling (optional)

For a nicer look in Obsidian Reading mode, the repo ships a CSS snippet at `skills/atag/companion/atag-callouts.css`. Copy it into your vault's `.obsidian/snippets/`, then enable it via Settings → Appearance → CSS snippets. Renders amber for active threads, green for resolved.

## Tests

Two test harnesses live under `skills/atag/reference/`:

**Spec test** — verifies the scan commands in `SKILL.md` against the fixture catalog in `markdown-agent-tags.spec.md`. Requires `bun >= 1.3`.

```bash
bun test skills/atag/reference/markdown-agent-tags.spec.test.ts
bun test skills/atag/reference/atag-poll.test.ts
```

**Model comparison** — runs the skill across multiple Claude models on a graded fixture, saves each result to `reference/model-comparison/results/<model>.md` (gitignored) for eyeball comparison.

```bash
cd skills/atag/reference/model-comparison
./run.sh haiku-4.5 sonnet-4.6 opus-4.7
```

See `reference/model-comparison/README.md` for the rubric.

## Feedback

Please direct issues or feedback to [github.com/smcllns/skills](https://github.com/smcllns/skills)
