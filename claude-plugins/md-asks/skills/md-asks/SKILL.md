---
name: md-asks
description: "Use when markdown files (Obsidian notes or regular .md) contain `@claude`, `@codex`, `@agent`, or user-specified `@trigger` asks. Also use when asked to resolve agent asks in markdown, scan for @agent comments, or process open `[!NOTE]+` threads."
---

# Markdown asks

A human writes `@codex do X` or `@claude do X` in a markdown file. This skill resolves agent asks in markdown and records the exchange in a callout thread.

## Example

User writes:

```
@codex can you clean up that formatting pls
```

After the agent acts:

```
> [!DONE]- cleaned up broken formatting
>
> @codex can you clean up that formatting pls
>
> @codex: done — removed broken newlines and added missing periods. No changes to text content.
```

The original ask is preserved verbatim as the first body line. The title is the outcome summary.

## Ask shapes

| Pattern | Status | Scan | Agent behavior |
|---|---|---|---|
| `@agent`, `@claude`, `@codex` | New | Picks up | New ask, action required. |
| `@<custom>` | New | Picks up if the caller specified custom triggers | New ask, action required. |
| `[!NOTE]+` | Active thread | Picks up | If the human spoke last, act. If the agent spoke last, leave it. |
| `[!DONE]-` | Resolved thread | Grep skips; DONE scan checks | If a human spoke after the agent marked done, act. Otherwise leave it. |

The `+/-` marker is load-bearing:
- `[!NOTE]+` distinguishes agent threads from regular callouts.
- `[!DONE]-` collapses the callout in Obsidian.

## Unresolved rule

An ask is unresolved when any of:

- An open `> [!NOTE]+ ...` callout whose last reply is from the user.
- A valid inline ask for a recognized trigger not yet processed into a callout.
- A resolved `> [!DONE]- ...` callout whose last speaker line is from a human.

## Resolution contract

For each unresolved ask:

- Read the file and enough surrounding context to understand the request.
- Use any better-matching skill/tool first when one applies.
- Do the requested work when it is concrete — edit the **document body**, not the callout. The callout gets a one-line acknowledgement; the actual change goes where the user asked for it.
- For discussion-only asks (no doc change requested), answer concisely inside the callout.
- If the ask sits on a task item, update the checkbox too.
- **Never remove or modify the original ask.** It must appear verbatim as the first body line of the resulting callout, in both `[!DONE]-` and `[!NOTE]+` cases.

**Conclude** with `[!DONE]-` and a one-line outcome summary as the title (past-tense action + scope, ≤~60 chars) once the work is genuinely complete.

**Take a turn** with `[!NOTE]+` if completion requires further input from the human, so the thread stays visually open.

## If further human input required

When the ask is ambiguous, missing context, or non-actionable, **don't guess**. Wrap with `[!NOTE]+`, keep the original ask as the first body line, and add a clarifying question:

```
> [!NOTE]+ awaiting clarification
>
> @claude tighten the wording above
>
> @claude: the wording above stretches back 12,000 words but your ask sounds smaller. Confirm: (1) the last paragraph, (2) the last 4 paragraphs on this topic, or (3) the full doc.
```

## Scanning for unresolved asks

Scan in two passes:

1. **Grep for new and active threads** — cheap single-line scan for inline asks and `[!NOTE]+` callouts.

```sh
grep -rlnE --include='*.md' '(\[!NOTE\]\+|^([^>]*[[:space:]])?@(agent|claude|codex)([^[:alnum:]_]|$))' <path>
```

2. **Awk to check DONE threads for follow-ups** — multiline scan for `[!DONE]-` callouts whose latest `> @name:` speaker is human.

```sh
find <path> -name '*.md' -exec awk -f reference/done-followups.awk {} +
```

Default agent names are `agent claude codex`. If the caller provides custom triggers, use the same names in both passes: substitute the grep alternation and pass them to awk.

```sh
find <path> -name '*.md' -exec awk -v agents='nora hermes' -f reference/done-followups.awk {} +
```

Sort matched files by mtime descending before capping.

## Tests

[`reference/markdown-agent-directives.spec.md`](reference/markdown-agent-directives.spec.md) is a rough first pass at a spec and test fixtures. It documents current edge cases and accepted false positives, but the protocol is still early and breaking changes are expected.

**Smoke test after setup:** create a scratch `.md` file with a simple `@codex` ask, run the skill against that folder, and confirm the ask is wrapped in a callout. Then add a human `> @sam: ...` follow-up inside the resulting `[!DONE]-` callout and run again; it should be picked up.

Contributor regression test: run `bun test` after changing scan commands, agent defaults, callout markers, or files under `reference/`.

## Discussion thread format

Inside a callout, separate every turn with a **single blank `>` line** — one paragraph per turn.

```markdown
> [!DONE]- tightened introduction
>
> @claude tighten the intro
>
> @claude: trimmed to 3 sentences — does that read OK or want to go shorter?
>
> @sam: shorter please, ~1 sentence
>
> @claude: done — single sentence.
```

For a soft line break inside a single turn, use two trailing spaces.

## Final message

By default, keep the last assistant message brief and easy to override.

If there are no changes, use one line: `Scanned N files in <path>. No open unresolved markdown asks with @<triggers> detected.`

If there are changes or human input is required, provide a clear, concise executive update with links to changed files and line numbers/anchors when available. Follow any user-specified summary format over this default.

## Best practices

**Don't prematurely limit results.** Actionable threads cluster in recently-touched files — sort matches by file mtime descending. If you must, cap after sorting.

**Callout is for discussion, not the work.** Edits go in the **document body**; the callout is a side thread for discussion and one-line acknowledgements of the changes made. Don't paste rewritten paragraphs, drafted sections, or new code into the reply — that belongs in the body. Discussion-only asks (e.g. `@claude why did we pick X?`) have no body edit, so the answer is the reply.

**Proactively correct formatting.** Allow the human to write shorthand imperfectly, and update the callout to use correct syntax if required, without modifying the discussion content itself.

**Reply using familiar agent name.** Instead of `> @agent: ...`, use the agent name the user expects in your context (`@claude`, `@codex`, `@pi`, `@hermes`, etc).

**Don't self-reply.** If the agent's last reply is the most recent line in a `[!NOTE]+` thread, the thread is waiting on the human. Leave it. If the same thread keeps showing up across scans with no human movement, mention it to the user.
