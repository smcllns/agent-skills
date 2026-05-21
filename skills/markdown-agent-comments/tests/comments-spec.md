# Comments spec — supported patterns

This document is **both the human reference and the source of the test suite**.
Each `## ` section below is one fixture: prose explains the pattern, the fenced
` ```md ` block is the markdown content, and the HTML annotation tells the test
runner whether the unresolved-scan should pick this file up.

```
<!-- @test: match   --> scan should find this file
<!-- @test: nomatch --> scan should skip this file
```

Sections without an `@test:` annotation (like this preamble) are ignored by the
runner — they're free for prose, framing, and category headers.

The test also auto-generates one fixture per agent name listed in the scan
regex's `#(name1|name2|…)\b` alternation in `SKILL.md`. Add a name there →
the fixture set extends automatically.

---

## Callout threads

The primary comment shape — a callout wrapping a discussion between human and agent.

## 1. Active callout awaiting agent reply
<!-- @test: match -->

`[!NOTE]+` is the open / unresolved state. The trailing `+` keeps the callout
expanded in Obsidian. Scan picks these up.

```md
> [!NOTE]+ @sam: active thread awaiting reply
```

## 2. Parked callout awaiting human
<!-- @test: nomatch -->

`[!NOTE]-` (collapsed) is the convention for "agent has replied, waiting on the
human." The scan skips these so the agent doesn't self-reply.

```md
> [!NOTE]- @sam: parked, awaiting human
```

## 3. Resolved callout
<!-- @test: nomatch -->

`[!DONE]-` marks a closed thread. Untouched by the scan.

```md
> [!DONE]- resolved thread
```

## 4. Wrapped directive inside a DONE callout
<!-- @test: nomatch -->

Once a `#claude` directive is wrapped in `[!DONE]-`, the leading `>` makes the
inline-directive regex skip it (the regex requires a non-`>` line start).

```md
> [!DONE]- #claude already wrapped
```

## 5. Directive inside an indented blockquote
<!-- @test: nomatch -->

Whitespace-indented blockquote — still a blockquote line, still filtered out.
The regex's `^[^>]` clause handles this.

```md
   > [!DONE]- #claude inside indented blockquote
```

---

## Inline directives

A one-shot `#<agent>` mention asking the agent to do something. Picked up by the
scan, resolved by wrapping in a `[!DONE]-` callout (see `SKILL.md`).

## 6. Directive indented by two spaces
<!-- @test: match -->

Indent doesn't change intent — still a directive.

```md
  #claude indented two spaces
```

## 7. Directive indented by one space
<!-- @test: match -->

Single space, caught after PR #94 round-2.

```md
 #claude single-space indent
```

## 8. Directive tab-indented
<!-- @test: match -->

Tab indent, also caught.

```md
	#claude tab-indented
```

## 9. Mid-line directive
<!-- @test: match -->

A `#claude` reference inside running prose, not at line start.

```md
see #claude for the rule (mid-line)
```

## 10. Trailing directive
<!-- @test: match -->

Sam's case from 2026-05-19 — directive at the end of a sentence.

```md
tell me my options please #claude
```

---

## Negative cases

Things that look like directives but shouldn't trigger the scan.

## 11. Plain prose
<!-- @test: nomatch -->

No callout, no `#agent` — nothing to do.

```md
just regular markdown, nothing to find
```

## 12. No word boundary after agent name
<!-- @test: nomatch -->

The `\b` in `#(claude|…)\b` requires a word boundary. `#claudewhatever` doesn't
have one — it's a different tag.

```md
#claudewhatever not a directive (no word boundary)
```

## 13. Word starting with an agent prefix
<!-- @test: nomatch -->

False-positive risk for short agent names like `pi`. `#piling` doesn't match
because there's no `\b` after `pi`.

```md
#piling false-positive risk for pi
```

## 14. No whitespace before `#`
<!-- @test: nomatch -->

`obsidian#claude` is a tag-on-word, not a directive. The regex requires either
line-start or whitespace before `#`.

```md
mention obsidian#claude with no separator
```

---

## Accepted false positives

Edge cases we _could_ filter but choose not to — the cost of a perfect regex
exceeds the value.

## 15. Hyphenated agent name like `#claude-team`
<!-- @test: match -->

`-` is a non-word char, so `\b` triggers right after `claude`. The whole `#claude-team`
matches. Rare enough that we accept it.

```md
#claude-team please review
```

## 16. Directive inside a fenced code block
<!-- @test: match -->

`grep` doesn't parse code fences, so a `#claude` inside ` ``` ` triple-backticks
will still match. We could fix this with a real parser but it's not worth the
weight today.

````md
```text
#claude inside a code block
```
````
