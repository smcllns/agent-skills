# ADR: atag speaker labels carry sender identity without punctuation

## Status

Accepted.

## Context

Markdown Agent Tags callout threads need a compact way to distinguish the original trigger tag from later conversation turns. The previous convention used inline-code speaker labels followed by a colon, such as `` `claude`: reply`` and ``*`sam`*: reply``. The first no-colon version used bare agent labels and emphasized human labels, but the human reply placeholder should be the simpler raw form because the human is the one editing it.

That colon made the label depend on punctuation to read as an author/from field. It also made the rendered thread feel more like transcript syntax than a lightweight document annotation.

## Decision

Speaker labels are inline-code sender/from fields with no trailing colon or other punctuation. Human labels use bare inline code; agent labels use emphasized inline code:

```markdown
> *`claude`* reply text
>
> `sam` reply text
```

The label must visually carry the sender role by itself. Companion CSS may style the label as a compact field, but should not reintroduce punctuation in generated content or pseudo-elements. Styling is role-based: the human label should keep the accented styling even though its raw markdown is now bare inline code, and the agent label should keep the quieter styling even though its raw markdown is now emphasized inline code.

## Consequences

- New agent replies use emphasized no-colon labels.
- New human turns use bare no-colon labels.
- Agents normalize colon-form labels when they touch an existing thread.
- Cheap scanners still recognize legacy colon-form agent labels so old notes do not become actionable forever.
- The original trigger tag still uses `@name`; speaker labels do not.
