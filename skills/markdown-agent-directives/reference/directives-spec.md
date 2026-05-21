# Directives spec — supported patterns

This document is **both the human reference and the source of the test suite**.
Each section below is one fixture: prose explains the pattern, and the fenced
block holds the markdown content. The fence's info string tells the runner
whether the scan should pick this file up:

- info `md @test:match` — scan should find this file
- info `md @test:nomatch` — scan should skip this file
- any other info string (or no fenced block) — ignored by the runner, free for
  prose, framing, and category headers (like this preamble)

The test also auto-generates one fixture per agent name in the documented
agent list. Add a name there → the fixture set extends automatically.

The scan catches **two** kinds of thing: `#agent` directives that haven't been
wrapped yet, and `[!NOTE]` callouts (any marker — they're the discussion
threads spawned from directives). `[!DONE]` callouts of any marker are filtered
out as resolved. `+`/`-` markers carry no protocol meaning — they're Obsidian
expand/collapse helpers only.

---

## Callouts

Discussion threads spawned from a `#agent` directive. The scan picks up every
`[!NOTE]` callout regardless of marker — the agent reads the thread and decides
whether action is needed (whoever spoke last is who's expected to act).

### Active callout — `[!NOTE]+`

`[!NOTE]+` is the expanded-by-default form.

```md @test:match
> [!NOTE]+ #claude tighten the intro
```

### Active callout — bare `[!NOTE]`

Bare `[!NOTE]` (no marker) is treated identically.

```md @test:match
> [!NOTE] #claude tighten the intro
```

### Parked callout — `[!NOTE]-`

`[!NOTE]-` is the collapsed-by-default form. **Still picked up by the scan** —
the agent reads the thread to decide whether the human's input is the most
recent line. If the agent spoke last, leave it alone.

```md @test:match
> [!NOTE]- #claude was the last reply mine?
```

### Resolved callout — `[!DONE]-` (dash)

`[!DONE]-` marks a closed, collapsed thread. Untouched by the scan.

```md @test:nomatch
> [!DONE]- resolved thread
```

### Resolved callout — bare `[!DONE]`

`[!DONE]` without any marker is still resolved. The marker carries no protocol
meaning.

```md @test:nomatch
> [!DONE] resolved thread (no marker)
```

### Resolved callout — `[!DONE]+` (plus)

`[!DONE]+` is also resolved — the marker is just an Obsidian helper.

```md @test:nomatch
> [!DONE]+ resolved thread (plus marker)
```

### Wrapped directive inside a DONE callout

Once a `#claude` directive is wrapped in `[!DONE]`, the leading `>` makes the
inline-directive regex skip it (the regex requires a non-`>` line start).

```md @test:nomatch
> [!DONE] #claude already wrapped
```

### Directive inside an indented blockquote

Whitespace-indented blockquote — still a blockquote line, still filtered out.
The regex's `^[^>]` clause handles this.

```md @test:nomatch
   > [!DONE] #claude inside indented blockquote
```

---

## Inline directives

A `#<agent>` mention asking the agent to do something. Picked up by the scan,
resolved by wrapping in a callout (see `SKILL.md`).

### Directive at line-start

The bread-and-butter case.

```md @test:match
#claude please pull in the canonical doc link here
```

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

## Inline code spans (escape hatch)

Wrapping a directive in inline backticks is the canonical way to write the
syntax in prose without firing the scan. The regex requires whitespace before
`#`, and a backtick is not whitespace.

### Code-span directive

```md @test:nomatch
The scan should not fire on `#claude` references inside backticks.
```

---

## Negative cases

Things that look like directives but shouldn't trigger the scan.

### Plain prose

No callout, no `#agent` — nothing to do.

```md @test:nomatch
just regular markdown, nothing to find
```

### No word boundary after agent name

The pattern requires a non-word character (or end-of-line) after the agent
name. `#claudewhatever` doesn't have one — it's a different tag.

```md @test:nomatch
#claudewhatever not a directive (no word boundary)
```

### Word starting with an agent prefix

False-positive risk for short agent names like `pi`. `#piling` doesn't match
because there's no word boundary after `pi`.

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

`-` is a non-word char, so the word-boundary check triggers right after
`claude`. The whole `#claude-team` matches. Rare enough that we accept it.

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
