# Wishlist

Future ideas and resolved protocol notes for Markdown Agent Tags (`atag`).

---

## Speaker labels

**Status:** resolved by [PR #26](https://github.com/smcllns/skills/pull/26).

**Decision:** reserve `@name` for trigger tags. Inside callout threads, speaker labels use compact inline-code markdown:

- `` `claude`: reply`` — agent turn, common/simple path
- ``*`sam`*: reply`` — human turn, emphasized because it is rarer and usually means the thread needs another agent response

**Example thread:**

```markdown
> [!NOTE]+ awaiting scope
>
> @claude this section is too wordy — can we simplify?
>
> `claude`: Can do — should I trim to 3 bullets, or fold the whole thing into the next paragraph?
>
> *`sam`*: 3 bullets please
>
> `claude`: Done.
```

**Why this resolved the wishlist item:**

- Raw markdown now clearly separates trigger syntax (`@claude`) from speaker labels (`` `claude`:``).
- Human turns are visually emphasized without making the common agent reply syntax noisy.
- Companion CSS can style `code:first-child` and `em:first-child > code:first-child` without HTML or non-portable markdown attributes.
