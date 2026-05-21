---
name: markdown-agent-directives
description: "Use when a markdown file (Obsidian note or any .md) contains one or more `#claude`, `#codex`or `#agent` tags requesting input or changes on the document."
---

# Markdown Agent Directives

A human writes `#claude do X` in a markdown file. This skill finds those directives, does the work, and wraps the exchange in a callout which contains the related discussion thread.


## Example

User writes:

```
#claude can you clean up that formatting pls
```

After the agent acts, the line becomes:

```
> [!DONE]- cleaned up broken formatting
> 
>  #claude can you clean up that formatting pls
>
> ---
>
> @claude: done — removed broken newlines and added missing periods at the end of sentences. No changes to text content.
```

## Directive Shapes

| Pattern | Status | Scan | Agent behavior |
|---|---|---|---|
| `#agent` | New | Picks up | New directive, action required. |
| `[!NOTE]` | Active | Picks up | Read the thread. If the human spoke last, act. If the agent spoke last, leave it. |
| `[!DONE]` | Resolved | Skips | Will not process |

For the full pattern catalog (indents, edge cases, accepted false positives), see [`reference/directives-spec.md`](reference/directives-spec.md)

## Unresolved rule

A comment is unresolved when any of:

- An open callout > [!NOTE] ... whose last line is from the user (no agent reply yet, OR an agent replied earlier and the user has since posted a follow-up the agent hasn't answered).
- A shorthand inline #agent directive that has not yet been wrapped in a [!DONE]- callout.

## Resolution Contract

For each unresolved comment:

- Read the full file and enough surrounding context to understand the request.
- Use any better-matching skill/tool first when one applies.
- Do the requested work when it is concrete — edit the document body, not the callout. The callout gets a one-line acknowledgement; the actual change goes where the user asked for it.
- For discussion comments (no doc change requested), answer concisely inside the callout.
- If the comment sits on a task item, update the checkbox too.

**Conclude** if the work is genuinely complete, with `[!DONE]-` callout and write a one-line outcome summary as the title (past-tense action + scope, ≤~60 chars).

## If further input required

**Take a turn** if you've acted but require further input from the human, with `[!NOTE]+` callout so the thread stays visually open, awaiting human input.

**If you can't act** because the request is ambiguous, missing context, or non-actionable, **don't guess**, wrap the directive in a `[!NOTE]+` callout with a clarifying question:

```
> [!NOTE]+ #claude tighten the wording above
> @claude: the request is ambiguous — the wording above stretches back 12,000 words but your ask sounds smaller. Please confirm: (1) the last paragraph, (2) the last 4 paragraphs on this topic, or (3) the full doc.
```

## Scanning for unresolved directives

Find files with directives or open threads, sort by file mtime, then cap:

```sh
grep -rlnE --include='*.md' '(\[!NOTE\]|^([^>]*[[:space:]])?#(agent|claude|codex)([^[:alnum:]_]|$))' <path>
```

Two patterns are matched:

- **Inline directive** — `#claude`, `#codex`, or `#agent` at line-start, indented or mid-prose with a preceding space
- **Open callout** — any `[!NOTE]` callout

What #agent directives are exempt:

- **Resolved directives** - `[!DONE]` (any marker) is filtered.
- **Invalid tags** - Whitespace or newline is required before `#`, so `example.com#claude` and \`#claude\` (inside backticks) will not trigger.
- **Tags within callouts** - the `^[^>]` clause skips directives inside callouts.

## Discussion Thread Format

Once a `#claude` directive is wrapped, the callout is the place for further turns. 

- **Separate every speaker turn** with `> ---` on its own line, blank `>` lines on either side. The callout title acts as the separator before the first reply. Without the rule, long replies bleed together visually.

  ```markdown
  > [!NOTE]+ tightened introduction
  >
  > #claude tighten the intro
  > 
  > ---
  >
  > @claude: trimmed to 3 sentences — does that read OK or want to go shorter?
  >
  > ---
  >
  > @sam: shorter please, ~1 sentence
  >
  > ---
  >
  > @claude: done — single sentence.
  ```

## Best practices:

**Don't self-reply.** If the agent's last reply is the most recent line in a `[!NOTE]` thread, the thread is waiting on the human. Leave it. If the same thread keeps showing up across scans with no human movement, mention it to the user (e.g. "this thread's been open without follow-up for N scans, want me to close or chase it?").

**Don't prematurely limit results.** Actionable threads cluster in recently-touched files, so sort matches by file mtime descending. If you must, cap after sorting.

**Use callout only for discussion, not the work.** Edits go in the **document body**; the callout is a side thread for discussion and one-line acknowledgements of the changes made. Don't paste rewritten paragraphs, drafted sections, or new code into the reply — that belongs in the body. Discussion-only directives (e.g. `#claude why did we pick X?`) have no body edit, so the answer is the reply.

**Reply using familiar name.** Instead of `> @agent: ...`, you can use the agent name the user expects in your context (`@claude`, `@codex`, `@pi`, `@hermes`).

**Backwards compatibility.** The scan will pick up [!NOTE] callouts in docs. If there is no sign of a #agent directive in the title however, it will be considered a standard markdown callout, not an active thread requiring action.