# Wishlist

Future ideas and resolved protocol notes for Markdown Agent Tags (`atag`).

---

## Speaker labels

**Status:** resolved by [PR #26](https://github.com/smcllns/skills/pull/26).

**Decision:** reserve `@name` for trigger tags. Inside callout threads, speaker labels use compact inline-code markdown:

- ``*`claude`* reply`` — current agent turn
- `` `sam` reply`` — current human turn, bare because this is the prefilled label the human edits after

**Example thread:**

```markdown
> [!NOTE]+ awaiting scope
>
> @claude this section is too wordy — can we simplify?
>
> *`claude`* Can do — should I trim to 3 bullets, or fold the whole thing into the next paragraph?
>
> `sam` 3 bullets please
>
> *`claude`* Done.
```

**Why this resolved the wishlist item:**

- Raw markdown now clearly separates trigger syntax (`@claude`) from speaker labels (``*`claude`*`` and `` `sam` ``).
- Human turns keep the accented rendered style while using the simplest raw placeholder for the human to edit.
- Companion CSS can style `code:first-child` and `em:first-child > code:first-child` without HTML or non-portable markdown attributes.
