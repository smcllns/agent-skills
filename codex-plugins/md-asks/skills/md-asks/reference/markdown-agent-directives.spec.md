# Asks spec — supported patterns

This document is **both the human reference and the source of the test suite**.
Each section below is one fixture: prose explains the pattern, and the fenced
block holds the markdown content. The fence's info string tells the runner
whether the scan should pick this file up:

- info `md @test:match` — scan should find this file
- info `md @test:nomatch` — scan should skip this file
- info `md @done:match` — DONE seal scan should find this file
- info `md @done:nomatch` — DONE seal scan should skip this file
- any other info string (or no fenced block) — ignored by the runner, free for
  prose, framing, and category headers (like this preamble)

The test also auto-generates one fixture per agent name in the documented
agent list. Add a name there → the fixture set extends automatically.

The fast grep scan catches **two** kinds of thing: `@agent` asks that haven't
been wrapped yet, and `[!NOTE]+` callouts (active agent threads). The DONE seal
scan catches `[!DONE]-` callouts whose latest nonblank quoted line does not end
with `<!--md-asks:eot-->`.

The marker is the protocol signal: only `+` on `[!NOTE]` and `-` on `[!DONE]`
indicate an agent thread. Bare `[!NOTE]`, `[!NOTE]-`, `[!DONE]`, and `[!DONE]+`
are all plain markdown callouts — the scans ignore them. This way the agent
never has to inspect a regular note-taking callout to figure out it's not for
them.

The DONE seal is deliberately append-friendly: a human can type directly after
the token, without a blank quoted separator or speaker label, and the thread
becomes unresolved until an agent inspects it and reseals the final reply.

Inside callouts, `@name` is only for the original trigger ask. Agent replies use
plain inline-code speaker labels (`` `claude`:``). Human replies use emphasized
inline-code speaker labels (``*`sam`*:``). The colon stays outside the label.
`@name:` is not a supported speaker-label format.

---

## Callouts

Discussion threads spawned from an `@agent` ask use two markers:
`[!NOTE]+` while open, `[!DONE]-` when resolved.

### Active agent thread — `[!NOTE]+`

The only marker form that triggers the scan as an agent thread.

```md @test:match @done:nomatch
> [!NOTE]+ @claude tighten the intro
```

### Bare `[!NOTE]` — plain markdown, not an agent thread

A `[!NOTE]` without `+` is a regular Obsidian note callout. The scan skips it
even though it looks like a callout, because the protocol uses `+` to mark
"agent thread, active."

```md @test:nomatch @done:nomatch
> [!NOTE] Just a regular note callout, not for the agent
```

### `[!NOTE]-` — plain markdown, not an agent thread

Same rule: only `+` indicates an agent thread.

```md @test:nomatch @done:nomatch
> [!NOTE]- A collapsed note callout — still plain markdown
```

### Resolved agent thread — `[!DONE]-`

The canonical resolved marker. A sealed resolved thread ends the final
agent-authored quoted line with `<!--md-asks:eot-->`.

```md @test:nomatch @done:nomatch
> [!DONE]- resolved agent thread
>
> `claude`: done. <!--md-asks:eot-->
```

### Bare `[!DONE]` — plain markdown

`[!DONE]` without `-` is a regular markdown callout. Filtered by the scan
either way (the regex doesn't look for `[!DONE]`).

```md @test:nomatch @done:nomatch
> [!DONE] Just a regular done-style callout
```

### `[!DONE]+` — plain markdown

Same as above — filtered by the scan.

```md @test:nomatch @done:nomatch
> [!DONE]+ Some other plain done callout
```

### Unsealed wrapped ask inside a `[!DONE]-` callout

Once an `@claude` ask is wrapped in `[!DONE]-`, the leading `>` on its
line makes the inline-ask regex skip it (the regex requires a non-`>`
line start). The DONE seal scan still reports this callout unless the latest
nonblank quoted line ends with `<!--md-asks:eot-->`.

```md @test:nomatch @done:match
> [!DONE]- @claude already wrapped
```

### Human follow-up inside `[!DONE]-`

The grep scan skips this, but the DONE seal scan reports the callout because the
human wrote after the seal.

```md @test:nomatch @done:match
> [!DONE]- tightened intro
>
> @claude tighten the intro
>
> `claude`: done, tightened it. <!--md-asks:eot-->
> one more tweak please
```

### Resealed agent reply after human follow-up inside `[!DONE]-`

The DONE seal scan skips this because the latest nonblank quoted line ends with
the seal token.

```md @test:nomatch @done:nomatch
> [!DONE]- tightened intro
>
> @claude tighten the intro
>
> `claude`: done, tightened it. <!--md-asks:eot-->
> one more tweak please
>
> `claude`: done, tightened it again. <!--md-asks:eot-->
```

### Multiple DONE callouts with one unsealed

Any unsealed DONE callout in a file makes the file actionable.

```md @test:nomatch @done:match
> [!DONE]- first
>
> `claude`: done. <!--md-asks:eot-->

> [!DONE]- second
>
> `codex`: done.
```

### Ask inside an indented blockquote

Whitespace-indented blockquote — still a blockquote line, still filtered out.
The regex's `^[^>]` clause handles this.

```md @test:nomatch
   > [!DONE] @claude inside indented blockquote
```

---

## Inline asks

An `@<agent>` mention asking the agent to do something. Picked up by the scan,
resolved by wrapping in a callout (see `SKILL.md`).

### Ask at line-start

The bread-and-butter case.

```md @test:match
@claude please pull in the canonical doc link here
```

### Ask indented by two spaces

Indent doesn't change intent — still an ask.

```md @test:match
  @claude indented two spaces
```

### Ask indented by one space

Single space, caught after PR #94 round-2.

```md @test:match
 @claude single-space indent
```

### Ask tab-indented

Tab indent, also caught.

```md @test:match
	@claude tab-indented
```

### Mid-line ask

An `@claude` reference inside running prose, not at line start.

```md @test:match
see @claude for the rule (mid-line)
```

### Trailing ask

Sam's case from 2026-05-19 — ask at the end of a sentence.

```md @test:match
tell me my options please @claude
```

---

## Inline code spans (escape hatch)

Wrapping an ask in inline backticks is the canonical way to write the
syntax in prose without firing the scan. The regex requires whitespace before
`@`, and a backtick is not whitespace.

### Code-span ask

```md @test:nomatch
The scan should not fire on `@claude` references inside backticks.
```

---

## Negative cases

Things that look like asks but shouldn't trigger the scan.

### Plain prose

No callout, no `@agent` — nothing to do.

```md @test:nomatch
just regular markdown, nothing to find
```

### No word boundary after agent name

The pattern requires a non-word character (or end-of-line) after the agent
name. `@claudewhatever` doesn't have one — it's a different mention.

```md @test:nomatch
@claudewhatever not an ask (no word boundary)
```

### Word starting with an agent prefix

False-positive risk for short agent names. `@agency` doesn't match `@agent`
because there's no word boundary after `agent` (the `c` is a word char).

```md @test:nomatch
@agency false-positive risk for agent
```

### No whitespace before `@`

`contact@claude.com` is an email, not an ask. The regex requires either
line-start or whitespace before `@`.

```md @test:nomatch
reach me at contact@claude.com if needed
```

---

## Accepted false positives

Edge cases we _could_ filter but choose not to — the cost of a perfect regex
exceeds the value.

### Hyphenated agent name like `@claude-team`

`-` is a non-word char, so the word-boundary check triggers right after
`claude`. The whole `@claude-team` matches. Rare enough that we accept it.

```md @test:match
@claude-team please review
```

### Ask inside a fenced code block

`grep` doesn't parse code fences, so an `@claude` inside ` ``` ` triple-backticks
will still match. Use **inline code spans** (single backticks) to escape — see
above. Fenced blocks are accepted FPs because filtering them needs a real
markdown parser.

````md @test:match
```text
@claude inside a code block
```
````
