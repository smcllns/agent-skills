---
name: markdown-agent-comments
description: "Use when an Obsidian note or other markdown file contains inline comments addressed to agents with `> @human:` syntax, or `> [!NOTE]+ @commenter:` callouts, or `#claude`/`#codex`/`#agent` directives."
---

# Markdown Comments

Resolve comments a human left for an agent in markdown files. Work in place, preserve the thread, and reply as the current agent.

## Where the work goes

Edits go in the document body; the callout is a side thread for discussion and one-line acknowledgements and confirmations of changes made in the doc. Don't paste rewritten paragraphs, drafted sections, or new code into the reply — that belongs in the body. Discussion-only comments (e.g. "why did we pick X?") have no body edit, so the answer is the reply. When in doubt: does the answer belong in the final document? If yes, edit the body.

## Speaker labels

Agents wrap speaker labels in minimal HTML so editor CSS can render them as readable badges (useful in long threads). Humans aren't expected to write this — agents upgrade bare `@name:` shorthand on first touch, dropping the `:`.

```html
<cite>@sam</cite> human input on the same line…
<cite data-agent>@claude</cite> agent reply on the same line…
```

## Comment Shapes

<!--#agents ignore: example comments in this file are to illustrate the protocol; do not process them-->

### Callout thread

**Active** (`[!NOTE]+`, expanded — agent reply ends with a question, thread stays open):

> [!NOTE]+ <cite>@sam</cite> this section is too wordy — can we simplify?
>
> <cite data-agent>@claude</cite> Can do — should I trim to 3 bullets, or fold the whole thing into the next paragraph?
>
>

**Resolved** (`[!DONE]-`, collapsed with a one-line outcome summary):

> [!DONE]- trimmed section to 3 bullets per @sam
> <cite>@sam</cite> this section is too wordy — can we simplify?
>
> <cite data-agent>@claude</cite> Can do — should I trim to 3 bullets, or fold the whole thing into the next paragraph?
>
> ---
>
> <cite>@sam</cite> 3 bullets please
>
> ---
>
> <cite data-agent>@claude</cite> Done.

### Human shorthand input

Human friendly shorthands, such as: 

- `> @sam: ...`,
- `> sam: ...`,
- `@sam: ...` 

should **upgrade to `> [!NOTE]+ @sam: ...` on first touch**. 

Bare `sam: ...` (no `@`, no `>`) is **not** a comment — ignore.

### Inline directive (non-interactive)

One-shot imperative addressed to a specific agent — no conversation thread expected. The agent actions the request, then wraps the directive directly in a `[!DONE]-` callout with its reply inside. There is no `[!NOTE]+` stage.

User writes:

#claude can you clean up that formatting pls

Agent does the work, then converts to:

> [!DONE]- #claude can you clean up that formatting pls
>
> <cite data-agent>@claude</cite> done — removed broken newlines and added missing periods at the end of sentences. No changes to text content.

**If no concrete change can be made** (the request is ambiguous, missing context, or non-actionable), then add a normal `> @agent: ...` reply asking for clarification and escalate to your human for input through normal channels.

Example escalation:

> [!NOTE]+ #claude tighten the wording above
> <cite data-agent>@claude</cite> Breaking protocol because the request is ambiguous: I can't tell which paragraph you mean — the wording above stretches back for 12,000 words but your ask seems like a smaller one. Please confirm where to stop: (1) the last paragraph only (2) the last 4 paragraphs that cover this topic or (3) the entire document (all 12,000 words)?

## Unresolved rule

A comment is unresolved when any of:

- An open callout `> [!NOTE]+ ...` whose **last line is from the user** (no agent reply yet, OR an agent replied earlier and the user has since posted a follow-up the agent hasn't answered).
- A shorthand form (`> @sam:`, `> sam:`, `@sam:`) that has not yet been upgraded.
- An inline `#agent` directive that has not yet been wrapped in a `[!DONE]-` callout.

If the **last non-blank speaker line is from the agent** — even when the agent's reply ends with a question back to the user — the thread is **parked**, waiting on the user. Don't self-reply.

A `> [!DONE]-` callout is resolved — leave it alone unless reopened.

## Scanning for comments to resolve

The scan is `grep -rlnE --include='*.md' '(\[!NOTE\]\+|^#(claude|codex|pi|agent|hermes)\b)' <path>` — every match is by convention awaiting an agent reply. Two patterns:

- `[!NOTE]+` catches open callout threads. `[!NOTE]-` (parked, awaiting human) and `[!DONE]-` (resolved) are filtered out by the grep itself.
- `^#claude|#codex|#pi|#agent|#hermes` catches bare inline directives. Once wrapped, the directive line is prefixed with `> [!DONE]- `, so the `^#` anchor no longer matches — wrapped directives are filtered out for free.

When you park a thread on the human (your reply asks a question), flip the marker from `[!NOTE]+` to `[!NOTE]-` so the next scan skips it.

Across many files, sort matches by file mtime descending — actionable threads cluster in recently-modified files. Don't cap the result list silently; if you must, cap after sorting, never before.

## Resolution Contract

For each unresolved comment:

- Read the full file and enough surrounding context to understand the request.
- Use any better-matching skill/tool first when one applies.
- Do the requested work when it is concrete — **edit the document body**, not the callout. The callout gets a one-line acknowledgement; the actual change goes where the user asked for it. See "Where the work goes" above.
- For discussion comments (no doc change requested), answer concisely inside the callout.
- If the comment sits on a task item, update the checkbox too.

For thread comments:

- **Reply** as `> @agent: ...` below the original line, using the agent name the user expects (`@codex`, `@claude`, `@pi`, `@hermes`).
- **Separate every speaker turn with a horizontal rule** — write `> ---` on its own line between turns, with a blank `>` line on either side. The first reply (directly under the callout title) does not need a rule above it; the title is the separator. Renderers convert `---` to an `<hr>`, and the vault CSS styles it as a visible line between turns. Without the rule, long replies (paragraphs, lists, code blocks) bleed together and you can't tell where one speaker ends and the next begins.

  ```markdown
  > [!NOTE]+ <cite>@sam</cite> question?
  >
  > <cite data-agent>@claude</cite> long reply with bullets, then a follow-up question.
  >
  > ---
  >
  > <cite>@sam</cite> answer
  >
  > ---
  >
  > <cite data-agent>@claude</cite> done.
  ```
- **Pre-open user input** when your reply asks the human a question or needs another response: end with two blank quoted lines after your reply so the user can type on the final line.
  ```markdown
  > <cite data-agent>@claude</cite> I need input from you to act — should I do #1 or #3?
  >
  >
  ```
- **Resolve** when the thread is done: change `[!NOTE]+` → `[!DONE]-` and write a one-line outcome summary as the callout title. Preserve the thread inside. **Title convention:** past-tense action + scope, ≤ ~60 chars. Examples:
    - `[!DONE]- trimmed intro to 3 bullets per @sam`
    - `[!DONE]- agreed on Tuesday migration kickoff`

