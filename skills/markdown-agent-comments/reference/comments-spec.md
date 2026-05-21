# Comments spec — supported patterns

This document is **both the human reference and the source of the test suite**.
Each section below is one fixture: prose explains the pattern, and the fenced
block holds the markdown content. The fence's info string tells the runner
whether the unresolved-scan should pick this file up:

- info `md @test:match` — scan should find this file
- info `md @test:nomatch` — scan should skip this file
- any other info string (or no fenced block) — ignored by the runner, free for
  prose, framing, and category headers (like this preamble)

The test also auto-generates one fixture per agent name in the documented
agent list. Add a name there → the fixture set extends automatically.

---

## Callout threads

The primary comment shape — a callout wrapping a discussion between human and agent.

### Active callout — `[!NOTE]+`

`[!NOTE]+` is the open / unresolved state. The trailing `+` keeps the callout
expanded in Obsidian. Scan picks these up.

```md @test:match
> [!NOTE]+ @sam: active thread awaiting reply
```

### Active callout — bare `[!NOTE]`

Bare `[!NOTE]` (no marker) is treated as active. The `+`/`-` markers are
Obsidian ergonomic helpers; only `-` is decisive for the protocol (parked).

```md @test:match
> [!NOTE] @sam: bare marker, still active
```

### Parked callout — `[!NOTE]-`

`[!NOTE]-` (collapsed) is the convention for "agent has replied, waiting on the
human." The scan skips these so the agent doesn't self-reply.

```md @test:nomatch
> [!NOTE]- @sam: parked, awaiting human
```

### Resolved callout — `[!DONE]-` (dash)

`[!DONE]-` marks a closed, collapsed thread. Untouched by the scan.

```md @test:nomatch
> [!DONE]- resolved thread
```

### Resolved callout — bare `[!DONE]`

`[!DONE]` without any marker is still resolved. The marker carries no protocol
meaning for `[!DONE]` (unlike `[!NOTE]`, where `-` means parked).

```md @test:nomatch
> [!DONE] resolved thread (no marker)
```

### Resolved callout — `[!DONE]+` (plus)

`[!DONE]+` is also resolved — the marker is just the Obsidian expand-by-default
helper, no scan meaning.

```md @test:nomatch
> [!DONE]+ resolved thread (plus marker)
```

### Wrapped directive inside a DONE callout

Once a `#claude` directive is wrapped in `[!DONE]-`, the leading `>` makes the
inline-directive regex skip it (the regex requires a non-`>` line start).

```md @test:nomatch
> [!DONE]- #claude already wrapped
```

### Directive inside an indented blockquote

Whitespace-indented blockquote — still a blockquote line, still filtered out.
The regex's `^[^>]` clause handles this.

```md @test:nomatch
   > [!DONE]- #claude inside indented blockquote
```

---

## Inline directives

A one-shot `#<agent>` mention asking the agent to do something. Picked up by the
scan, resolved by wrapping in a `[!DONE]-` callout (see `SKILL.md`).

### Directive indented by two spaces

Indent doesn't change intent — still a directive.

```md @test:match
  #claude indented two spaces
```

### Directive indented by one space

Single space, caught after PR #94 round-2.

```md @test:match
 #claude single-space indent
```

### Directive tab-indented

Tab indent, also caught.

```md @test:match
	#claude tab-indented
```

### Mid-line directive

A `#claude` reference inside running prose, not at line start.

```md @test:match
see #claude for the rule (mid-line)
```

### Trailing directive

Sam's case from 2026-05-19 — directive at the end of a sentence.

```md @test:match
tell me my options please #claude
```

---

## Human shorthand input

Humans often write the simpler form rather than the full callout. The scan
picks these up; the agent upgrades them to the canonical `[!NOTE]+` callout
on first touch.

### Blockquote shorthand — `> @sam:`

```md @test:match
> @sam: can we shorten this paragraph?
```

### Bare line shorthand — `@sam:`

```md @test:match
@sam: any reason we're using react vs vue here?
```

### Bare prose `sam:` — NOT a comment

No `@` and no `>` — just looks like a sentence that starts with a name.

```md @test:nomatch
sam: this is just a sentence that happens to start with a name
```

### Blockquote without `@` — NOT a comment

We require `@` to distinguish shorthand from regular blockquotes (`> Note: ...`,
`> Definition: ...`, etc.).

```md @test:nomatch
> sam: missing @ makes this look like a regular blockquote
```

### Shorthand with no colon — NOT a comment

Without `:`, it's a mention, not an utterance.

```md @test:nomatch
> @sam said hi yesterday
```

### Mid-line `@name:` — NOT a comment

The shorthand pattern anchors at line-start (optionally preceded by `>`).

```md @test:nomatch
email me at @sam: my-handle for follow-ups
```

---

## Context-aware shorthand

Shorthand only fires when the previous line is **not** a blockquote line.
This keeps agent reply lines inside existing callouts (which all start with
`>`) from spuriously triggering the scan.

### Top-level shorthand after prose

A `> @sam:` preceded by a non-blockquote line is a new comment.

```md @test:match
some prose introducing context

> @sam: hey, can we revisit this?
```

### Active callout with agent reply

The active `[!NOTE]+` marker is what pulls this in — not the `> @claude:`
reply line, which would otherwise also be a shorthand match candidate.

```md @test:match
> [!NOTE]+ @sam: question
>
> @claude: my reply
```

### Agent reply inside a parked callout — NOT a comment

The key case for the context check: the agent's reply line (`> @claude: ...`)
sits inside a parked callout (`[!NOTE]-`). Without the context check this
would spuriously match shorthand and the scan would re-find every past
thread the agent ever touched.

```md @test:nomatch
> [!NOTE]- @sam: parked thread
>
> @claude: my agent reply line
```

### Human follow-up inside a parked callout — NOT a comment

Same logic: a shorthand line inside a blockquote is treated as continuation
of the callout, not as new input. **To re-open a parked thread, flip the
marker (`[!NOTE]-` → `[!NOTE]+`)** — a shorthand line posted inside the
parked callout alone won't be picked up by the scan.

```md @test:nomatch
> [!NOTE]- @sam: was parked
>
> @claude: my reply
>
> @sam: actually wait, follow-up
```

---

## Inline code spans (escape hatch)

Wrapping a directive or shorthand in inline backticks is the canonical way to
write the syntax in prose without firing the scan. The regex requires
whitespace before `#` and at the start of `@`, and a backtick is not whitespace.

### Code-span directive

```md @test:nomatch
The scan should not fire on `#claude` references inside backticks.
```

### Code-span shorthand

```md @test:nomatch
You can write `> @sam:` in docs without it triggering.
```

---

## Negative cases

Things that look like directives but shouldn't trigger the scan.

### Plain prose

No callout, no `#agent`, no `@name:` — nothing to do.

```md @test:nomatch
just regular markdown, nothing to find
```

### No word boundary after agent name

The `\b` in `#(claude|…)\b` requires a word boundary. `#claudewhatever` doesn't
have one — it's a different tag.

```md @test:nomatch
#claudewhatever not a directive (no word boundary)
```

### Word starting with an agent prefix

False-positive risk for short agent names like `pi`. `#piling` doesn't match
because there's no `\b` after `pi`.

```md @test:nomatch
#piling false-positive risk for pi
```

### No whitespace before `#`

`obsidian#claude` is a tag-on-word, not a directive. The regex requires either
line-start or whitespace before `#`.

```md @test:nomatch
mention obsidian#claude with no separator
```

---

## Accepted false positives

Edge cases we _could_ filter but choose not to — the cost of a perfect regex
exceeds the value.

### Hyphenated agent name like `#claude-team`

`-` is a non-word char, so `\b` triggers right after `claude`. The whole
`#claude-team` matches. Rare enough that we accept it.

```md @test:match
#claude-team please review
```

### Directive inside a fenced code block

`grep` doesn't parse code fences, so a `#claude` inside ` ``` ` triple-backticks
will still match. Use **inline code spans** (single backticks) to escape — see
above. Fenced blocks are accepted FPs because filtering them needs a real
markdown parser.

````md @test:match
```text
#claude inside a code block
```
````
