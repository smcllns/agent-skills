# Wishlist

Future ideas for `md-asks`:

* Keep this file for candidate protocol polish that is not yet ready for `SKILL.md`.


---

## Speaker labels

**Status:** accepted into the main protocol. Kept here as the decision record for why we did not use HTML.

**Problem solved:** in long, multi-turn threads, the eye loses track of who said what when every turn opens with `@sam:` or `@claude:` in plain text. `@name:` also makes raw markdown harder to scan because `@name` means both "trigger this agent" and "speaker label".

**Accepted shape:** reserve `@name` for trigger asks. Use inline-code speaker labels inside callouts:

- `` `claude`: reply`` — agent turn, common/simple path
- ``*`sam`*: reply`` — human turn, emphasized because it is the rarer and more actionable turn
- The trailing `:` stays outside the label

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

**Why not `<cite>`:**

- Adds HTML markup the user has to mentally skip when reading raw markdown
- Couples the protocol to HTML-ish rendering rather than compact markdown
- The inline-code/emphasis version gives CSS enough hooks without attributes
