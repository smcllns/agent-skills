# Wishlist

Future ideas for `markdown-agent-comments` — designed but intentionally not in v1 to keep the skill simple.

## Speaker labels (HTML `<cite>` badges)

**Idea:** in long, multi-turn threads, the eye loses track of who said what when every turn opens with `@sam:` or `@claude:` in plain text. Wrap the speaker name in a minimal HTML tag so editor CSS can render it as a visual badge.

**Form:**

```html
<cite>@sam</cite> human input on the same line…
<cite data-agent>@claude</cite> agent reply on the same line…
```

- `<cite>@name</cite>` — human turn
- `<cite data-agent>@name</cite>` — agent turn (distinguished via attribute so CSS can paint agents a different colour / weight)
- The trailing `:` from the shorthand form (`@sam:`) is **dropped** when upgrading to the badge form — the visual tag replaces the colon as the speaker delimiter

**Example thread:**

```markdown
> [!NOTE]+ <cite>@sam</cite> this section is too wordy — can we simplify?
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
```

**Why not v1:**

- Adds HTML markup the user has to mentally skip when reading raw markdown
- The colon form (`@sam:`) already encodes the speaker — badges are a polish, not a need
- Most threads are short enough that visual distinction isn't a problem yet
- Couples the skill to editor CSS to render well — without the CSS, badges look like clutter

**When to revisit:**

- If thread length grows (multi-page conversations become common)
- If multiple agents enter the same thread (`@claude` + `@codex` + `@hermes`) and human readers struggle to follow who said what
- If we ship vault CSS that styles `<cite>` and `<cite data-agent>` distinctively — at that point the cost-benefit flips

**Implementation when revisited:**

- Agents upgrade bare `@name:` to `<cite>@name</cite>` (or `<cite data-agent>` if the name is themselves) on first touch, dropping the `:`
- The unresolved-scan regex doesn't need to change — `[!NOTE]+` and `#agent` patterns are independent of the speaker syntax
- Update the SKILL.md examples to use cite tags
- Update `tests/comments-spec.md` to cover both bare and badge forms
