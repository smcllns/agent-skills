# md-asks model comparison fixture

This file contains 9 graded test cases at increasing difficulty. Run the md-asks skill on a copy of this file with a given model; the result file is graded against the rubric in `README.md`.

The cases are in independent sections so a per-case pass/fail can be assigned without cross-contamination.

---

## L1 — simple typo on its own line

Plase fix this lne it has two typos.

@claude fix the typos in the line above

---

## L2 — mid-prose edit referenced by ask

The weather report below says foo today.

foo

@claude change "foo" in the line above to "beautiful"

---

## L3 — ask on a task-list item

- [ ] migrate `config.yml` to the new v2 schema @claude do this and mark complete

---

## L4 — distant edit, oblique reference

### Intro

The intro is too long. The intro repeats itself. The intro could be shorter. The intro keeps saying the same thing. We should tighten the intro because right now the intro is too long.

### Body

Lorem ipsum dolor sit amet, the rest of the body is fine.

@claude clean up the intro above — it's too repetitive

---

## L5 — ambiguous, agent must take a turn (not guess)

A passage of writing precedes this ask. The writing is fine but could be many things — funnier, shorter, longer, more formal, more casual, more concrete, more abstract.

@claude make this better

---

## L6 — active thread waiting on agent reply

> [!NOTE]+ drafting a headline
>
> @claude give me a headline for this section
>
> @claude: how about "Three reasons to switch to v2"?
>
> @sam: closer but make it more concrete — mention the actual benefit

---

## L7 — already-resolved thread (must be skipped)

> [!DONE]- prior fix landed
>
> @claude fix the typo
>
> @claude: done — replaced "teh" with "the". <!--md-asks:eot-->

---

## L8 — false-positive traps (none should trigger)

An email address: contact@claude.com — this is part of an email, not an ask.

Inline code mention: `@claude` is the syntax used to invoke an agent.

> A blockquote mentioning @claude inside it does not count, because the regex skips `>`-prefixed lines.

---

## L9 — discussion-only (no body edit)

We picked approach X over approach Y last quarter. Approach X uses async batch processing; approach Y was a streaming model.

@claude why did we pick approach X over approach Y here?
