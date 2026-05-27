# ADR: atag speaker labels carry sender identity without punctuation

## Status

Accepted.

## Context

Markdown Agent Tags callout threads need a compact way to distinguish the original trigger tag from later conversation turns. The previous convention used inline-code speaker labels followed by a colon, such as `` `claude`: reply`` and ``*`sam`*: reply``.

That colon made the label depend on punctuation to read as an author/from field. It also made the rendered thread feel more like transcript syntax than a lightweight document annotation.

## Decision

Speaker labels are inline-code sender/from fields with no trailing colon or other punctuation:

```markdown
> `claude` reply text
>
> *`sam`* reply text
```

The label must visually carry the sender role by itself. Companion CSS may style the label as a compact field, but should not reintroduce punctuation in generated content or pseudo-elements.

## Consequences

- New agent replies use the no-colon form.
- Agents normalize colon-form labels when they touch an existing thread.
- Cheap scanners still recognize legacy colon-form agent labels so old notes do not become actionable forever.
- The original trigger tag still uses `@name`; speaker labels do not.
