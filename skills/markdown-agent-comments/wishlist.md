# Wishlist

Future ideas for `markdown-agent-comments`:

* **[Speaker labels](#speaker-labels)**: enable styling on speaker names to make it easier to scan bigger threads


---

## Speaker labels

**Problem to solve:** in long, multi-turn threads, the eye loses track of who said what when every turn opens with `@sam:` or `@claude:` in plain text. Cannot style them as-is because it's all text within a callout.

**Proposal:** The agent when it processes the comments, adds minimal markup to enable styling without making the raw markdown too noisy. No change to how humans write.

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