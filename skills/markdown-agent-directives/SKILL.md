---
name: markdown-agent-directives
description: "Use when a markdown file (Obsidian note, repo doc, plain note) contains a `#claude`/`#codex`/`#agent` directive — a hashtag-prefixed ask addressed to an agent. The agent does the work, edits the doc body, and records the exchange in a callout that can be discussed further if the work needs follow-up."
---

# Markdown Agent Directives

A human writes `#claude do X` in a markdown file. This skill finds those directives, does the work, and wraps the exchange in a callout. If the work needs more turns, the callout becomes the discussion thread.

The trigger is the hashtag — that's the only way to engage the agent.

## Example

User writes:

```
#claude can you clean up that formatting pls
```

After the agent acts, the line becomes:

```
> [!DONE] #claude can you clean up that formatting pls
>
> @claude: done — removed broken newlines and added missing periods at the end of sentences. No changes to text content.
```

The agent edits the document body (the formatting fix) and records the request + reply in the callout.

For the full pattern catalog (indents, edge cases, accepted false positives), see [`reference/directives-spec.md`](reference/directives-spec.md).

## Where the work goes

Edits go in the **document body**; the callout is a side thread for discussion and one-line acknowledgements of the changes made. Don't paste rewritten paragraphs, drafted sections, or new code into the reply — that belongs in the body. Discussion-only directives (e.g. `#claude why did we pick X?`) have no body edit, so the answer is the reply. When in doubt: does the answer belong in the final document? If yes, edit the body.

## Resolving a directive

A `#claude` directive is the entrypoint. Do the work, then wrap the original line in a callout with a one-line reply:

```
> [!DONE] #claude can you clean up that formatting pls
>
> @claude: done — removed broken newlines and added missing periods at the end of sentences. No changes to text content.
```

If the work is genuinely complete, use `[!DONE]`. If you've replied but the human may want to follow up, use `[!NOTE]+` so the thread stays visually open.

## Continuing a thread

Once a `#claude` directive is wrapped, the callout is the place for further turns. The human can extend the thread with their own line; the agent picks it up on the next scan if the human's input is the most recent line.

- **Reply** as `> @agent: ...` below the human's latest line, using the agent name the user expects (`@claude`, `@codex`, `@pi`, `@hermes`).
- **Separate every speaker turn** with `> ---` on its own line, blank `>` lines on either side. The callout title acts as the separator before the first reply. Without the rule, long replies bleed together visually.

  ```markdown
  > [!NOTE]+ #claude tighten the intro
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
- **Resolve** when the thread is done: change `[!NOTE]+` → `[!DONE]` and write a one-line outcome summary as the title (past-tense action + scope, ≤~60 chars):

    - `[!DONE] trimmed intro to 1 sentence per @sam`
    - `[!DONE] agreed on Tuesday migration kickoff`

## When you can't act

If the request is ambiguous, missing context, or non-actionable, **don't guess**. Wrap the directive in a `[!NOTE]+` callout with a clarifying question:

```
> [!NOTE]+ #claude tighten the wording above
> @claude: the request is ambiguous — the wording above stretches back 12,000 words but your ask sounds smaller. Please confirm: (1) the last paragraph, (2) the last 4 paragraphs on this topic, or (3) the full doc.
```

The thread stays open until the human responds.

## Other surfaces

- **Task items** (`- [ ]`) referenced by a directive — update the checkbox alongside the body edit.
- **Better-matching skill or tool** — use it first when one applies.

---

## How the scan works

Find files with directives or open threads via:

```
grep -rlnE --include='*.md' '(\[!NOTE\]|^([^>]*[[:space:]])?#(claude|codex|pi|agent|hermes)([^[:alnum:]_]|$))' <path>
```

Two patterns are matched:

- **Inline directive** — `#claude`, `#codex`, etc. at line-start, indented, or mid-prose. The pattern requires whitespace before `#`, so `obsidian#claude` doesn't trigger — and writing `` `#claude` `` in inline code is the canonical escape hatch for mentioning the syntax in prose. The `^[^>]` clause rejects blockquote lines, so directives wrapped in `[!DONE]` or any other callout are filtered automatically.
- **Open callout** — any `[!NOTE]`, regardless of `+`/`-` marker. `[!DONE]` (any marker) is filtered.

The `+` and `-` markers on callouts are Obsidian's expand/collapse helpers — **no protocol meaning here**. The agent decides what to do by reading the thread's last speaker, not the marker.

| Callout | Scan | Agent behavior |
|---|---|---|
| `[!NOTE]` (any marker) | Picks up | Read the thread. If the human spoke last, act. If the agent spoke last, leave it — see below. |
| `[!DONE]` (any marker) | Skips | Resolved, untouched until reopened. |

**Don't self-reply.** If the agent's last reply is the most recent line in a `[!NOTE]` thread, the thread is waiting on the human. Leave it. If the same thread keeps showing up across scans with no human movement, mention it to the user (e.g. "this thread's been open without follow-up for N scans, want me to close or chase it?").

Across many files, sort matches by file mtime descending — actionable threads cluster in recently-touched files. Don't cap the result list silently; if you must, cap after sorting.
