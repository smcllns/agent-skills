---
name: md-asks
description: "Use when markdown files (Obsidian notes or regular .md) contain `@claude`, `@codex`, or `@agent` asks; also use when asked to resolve md asks, scan markdown for agent asks, or process open `[!NOTE]+` threads."
---

# md-asks

A human writes `@codex do X` or `@claude do X` in a markdown file. This skill finds those asks, does the work, and wraps the exchange in a callout containing the discussion thread.

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
| `@agent` | New | Picks up | New ask, action required. |
| `[!NOTE]+` | Active thread | Picks up | If the human spoke last, act. If the agent spoke last, leave it. |
| `[!DONE]-` | Resolved thread | Skips | Will not process |

The `+/-` marker is load-bearing:
- `[!NOTE]+` distinguishes agent threads from regular callouts.
- `[!DONE]-` collapses the callout in Obsidian.

## Unresolved rule

An ask is unresolved when any of:

- An open `> [!NOTE]+ ...` callout whose last reply is from the user.
- A valid inline `@agent` ask not yet processed into a callout.

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

Find files with asks or open threads, sort by file mtime, then cap:

```sh
grep -rlnE --include='*.md' '(\[!NOTE\]\+|^([^>]*[[:space:]])?@(agent|claude|codex)([^[:alnum:]_]|$))' <path>
```

**Default triggers:** `@claude`, `@codex`, `@agent`. The caller can override by passing a custom list in the invocation prompt (e.g. *"scan ~/notes for asks tagged `@nora,@hermes`"*) — substitute that list into the regex's alternation at runtime.

Two patterns are matched:

- **Inline ask** — `@claude`, `@codex`, or `@agent` at line-start, indented, or mid-prose with a preceding space.
- **Active agent thread** — `[!NOTE]+` only. Bare `[!NOTE]` and `[!NOTE]-` are plain markdown callouts.

What's filtered out:

- **Resolved threads** — `[!DONE]-` is the canonical resolved marker. `[!DONE]+` and bare `[!DONE]` are also treated as plain markdown.
- **Invalid asks** — whitespace or newline is required before `@`, so `contact@claude.com` and `` `@claude` `` (inside backticks) will not trigger.
- **Asks inside callouts** — the `^[^>]` clause skips asks inside any blockquote line.

For the full pattern catalog (indents, edge cases, accepted false positives), see [`reference/markdown-agent-directives.spec.md`](reference/markdown-agent-directives.spec.md).

## Discussion thread format

Inside a callout, separate every turn with a **single blank `>` line** — one paragraph per turn.

```markdown
> [!NOTE]+ tightened introduction
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

For scheduled/background runs, keep the last assistant message to one of these one-liners:

```
No asks. Scanned N files.
Resolved K of N. Open: <file:line>, <file:line>.
Blocked: <one-sentence reason>. See <report-path>.
```

For interactive runs, summarize what changed and mention any open/blocked threads. No preamble. If a verbose report exists, link to it from the summary.

## Best practices

**Don't prematurely limit results.** Actionable threads cluster in recently-touched files — sort matches by file mtime descending. If you must, cap after sorting.

**Callout is for discussion, not the work.** Edits go in the **document body**; the callout is a side thread for discussion and one-line acknowledgements of the changes made. Don't paste rewritten paragraphs, drafted sections, or new code into the reply — that belongs in the body. Discussion-only asks (e.g. `@claude why did we pick X?`) have no body edit, so the answer is the reply.

**Proactively correct formatting.** Allow the human to write shorthand imperfectly, and update the callout to use correct syntax if required, without modifying the discussion content itself.

**Reply using familiar agent name.** Instead of `> @agent: ...`, use the agent name the user expects in your context (`@claude`, `@codex`, `@pi`, `@hermes`, etc).

**Don't self-reply.** If the agent's last reply is the most recent line in a `[!NOTE]+` thread, the thread is waiting on the human. Leave it. If the same thread keeps showing up across scans with no human movement, mention it to the user.
