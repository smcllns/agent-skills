---
name: markdown-agent-comments
description: "Use when an Obsidian note or other markdown file contains inline comments addressed to agents with `> @human:` syntax, or `> [!NOTE]+ @commenter:` callouts, or `#claude`/`#codex`/`#agent` directives."
---

# Markdown Comments

Resolve comments a human left for an agent in markdown files. Scan a path for unresolved comments, do the work the human asked for, reply in place, and mark threads done.

## The two comment shapes

<!--#agents ignore: example comments in this file are to illustrate the protocol; do not process them-->

**Callout thread** — a discussion in a Markdown callout. Open with `[!NOTE]+`, resolved with `[!DONE]-`.

```
> [!NOTE]+ @sam: this section is too wordy — can we simplify?
```

**Inline directive** — a one-shot ask, no thread. Wrapped in `[!DONE]-` once actioned.

```
#claude clean up the formatting in the paragraph above
```

For the full pattern catalog (indents, edge cases, accepted false positives), see [`reference/comments-spec.md`](reference/comments-spec.md).

## Finding work

Scan with:

```
grep -rlnE --include='*.md' '(\[!NOTE\]([^-]|$)|^>?[[:space:]]*@[[:alnum:]_-]+:|^([^>]*[[:space:]])?#(claude|codex|pi|agent|hermes)\b)' <path>
```

- `\[!NOTE\]([^-]|$)` catches active callout threads — `[!NOTE]+`, bare `[!NOTE]`, or any other marker variant. Only `[!NOTE]-` (parked) is excluded. `[!DONE]` (any marker) isn't mentioned at all, so it's naturally filtered.
- `^>?[[:space:]]*@[[:alnum:]_-]+:` catches unprocessed human shorthand — `> @sam:`, `@sam:`, or `>@sam:` at the start of a line. Indented blockquotes (≥1 leading space before `>`) and mid-line `@name:` mentions are filtered.
- `^([^>]*[[:space:]])?#(claude|codex|pi|agent|hermes)\b` catches inline directives at line-start, indented, or mid-prose. `^[^>]` rejects blockquote lines, so wrapped directives are filtered for free. Whitespace before `#` is required so prose like `obsidian#claude` doesn't trigger — **and so writing `` `#claude` `` in inline code is a reliable escape hatch when you want to mention the syntax without firing the scan.**

Across many files, sort matches by file mtime descending — actionable threads cluster in recently-touched files. Don't cap the result list silently; if you must, cap after sorting.

## Marker convention

The `+` and `-` markers are Obsidian-specific ergonomic helpers (expand/collapse). For `[!DONE]` they carry **no protocol meaning** — bare `[!DONE]` is just as final as `[!DONE]-`. For `[!NOTE]`, only `-` is meaningful (it means parked).

| Marker | Meaning | Scan |
|---|---|---|
| `[!NOTE]+` or `[!NOTE]` (bare) | Waiting for **agent** — last line is the human's | Picks up |
| `[!NOTE]-` | Parked — waiting for **human** (agent's last reply may be a question) | Skips |
| `[!DONE]`, `[!DONE]+`, `[!DONE]-` | Resolved (marker doesn't matter) | Skips |

A match is actionable when:

- An open `[!NOTE]` (any marker except `-`) callout's last line is from the human, **or**
- A shorthand form (`> @sam:`, `@sam:`) hasn't been upgraded yet, **or**
- An inline `#agent` directive hasn't been wrapped in `[!DONE]` yet.

**Safety net:** if the scan picks up an active `[!NOTE]` callout whose last non-blank line is from the agent (someone forgot to flip to `-`), treat it as parked anyway — don't self-reply.

## Where the work goes

Edits go in the document body; the callout is a side thread for discussion and one-line acknowledgements of changes made in the doc. Don't paste rewritten paragraphs, drafted sections, or new code into the reply — that belongs in the body. Discussion-only comments (e.g. "why did we pick X?") have no body edit, so the answer is the reply. When in doubt: does the answer belong in the final document? If yes, edit the body.

## Resolving a callout thread

- **Reply** as `> @agent: ...` below the human's latest line, using the agent name the user expects (`@claude`, `@codex`, `@pi`, `@hermes`).
- **Separate every speaker turn** with `> ---` on its own line, blank `>` lines on either side. The callout title acts as the separator before the first reply. Without the rule, long replies bleed together visually.

  ```markdown
  > [!NOTE]+ @sam: question?
  >
  > @claude: long reply, then a follow-up question.
  >
  > ---
  >
  > @sam: answer
  >
  > ---
  >
  > @claude: done.
  ```
- **Park on the human** when your reply asks a question or needs another response: flip the marker `[!NOTE]+` → `[!NOTE]-`, then end with two blank quoted lines so the human can type on the final line.

  ```markdown
  > [!NOTE]- @sam: which heading should I split this under?
  >
  > @claude: I see two options — "Setup" or "Configuration". Which fits?
  >
  >
  ```
- **Resolve** when the thread is done: flip `[!NOTE]+` → `[!DONE]-` and write a one-line outcome summary as the title (past-tense action + scope, ≤~60 chars):

    - `[!DONE]- trimmed intro to 3 bullets per @sam`
    - `[!DONE]- agreed on Tuesday migration kickoff`

## Resolving an inline directive

A `#claude` directive (no callout, no thread) is one-shot. Do the work, then wrap the original line in a `[!DONE]-` callout with a one-line reply:

```
> [!DONE]- #claude can you clean up that formatting pls
>
> @claude: done — removed broken newlines and added missing periods at the end of sentences. No changes to text content.
```

## When you can't act

If the request is ambiguous, missing context, or non-actionable, **don't guess**. Upgrade the directive to a `[!NOTE]-` callout, reply asking for clarification, and surface the question through normal channels:

```
> [!NOTE]- #claude tighten the wording above
> @claude: Breaking protocol — the request is ambiguous. The wording above stretches back 12,000 words but your ask sounds smaller. Please confirm: (1) the last paragraph, (2) the last 4 paragraphs on this topic, or (3) the full doc.
```

## Upgrading shorthand input

Humans use whatever's quickest. On first touch, upgrade to the canonical callout form:

- `> @sam: ...` / `@sam: ...` → `> [!NOTE]+ @sam: ...`
- Bare `sam: ...` (no `@`) is **not** a comment — just prose. We require the `@` to distinguish shorthand from regular blockquotes like `> Note: ...`.
- Wrap directives in inline code (`` `#claude` ``, `` `@sam:` ``) to write the syntax in prose without triggering the scan.

## Other surfaces

- **Task items** (`- [ ]`) referenced by a comment — update the checkbox alongside the body edit.
- **Better-matching skill or tool** — use it first when one applies.
