---
name: obsidian-comments
description: "Resolve human-authored comments in Obsidian notes and other markdown files using callout threads and inline #agent directives."
---

# Markdown Comments

Resolve comments a human left for an agent in markdown files. Work in place, preserve the thread, and reply as the current agent.

## Comment Shapes

### Callout thread

Two states — **active** (`[!NOTE]+`, expanded) and **resolved** (`[!DONE]-`, collapsed, with a one-line outcome summary in the title).

Active (agent reply ends with a question, so the thread stays open):

> [!NOTE]+ @sam: this section is too wordy — can we simplify?
>
> @claude: Can do — should I trim to 3 bullets, or fold the whole thing into the next paragraph?
>
>

Resolved (agent collapses + summarizes once the thread is done):

> [!DONE]- trimmed section to 3 bullets per @sam
> @sam: this section is too wordy — can we simplify?
>
> @claude: Can do — should I trim to 3 bullets, or fold the whole thing into the next paragraph?
>
> 3 bullets please
>
> @claude: Done.

Threads support the usual inline markdown — code blocks, bold, lists, links:

> [!NOTE]+ @sam: the `User` type has too many `any`s — can we tighten it?
>
> @claude: Here's a sketch:
>
> ```ts
> type UserId = string & { __brand: "UserId" };
>
> interface User {
>   id: UserId;
>   email: string;
> }
> ```
>
> Two questions before I propagate it:
>
> 1. Should **`UserId`** be a branded string (as above), or a full nominal type?
> 2. Same treatment for `email` — keep `string`, or introduce an `Email` brand too?

### Human shorthand input

The human may open a thread in any of these forms. The agent **upgrades to a `[!NOTE]+` callout on first touch**:

| User writes | Agent upgrades to |
|---|---|
| `> @sam: ...` | `> [!NOTE]+ @sam: ...` |
| `> sam: ...`  | `> [!NOTE]+ @sam: ...` |
| `@sam: ...` (no leading `>`) | `> [!NOTE]+ @sam: ...` |

Bare `sam: ...` (no `@`, no `>`) is **not** a comment — ignore.

### Inline directive

One-shot imperative addressed to a specific agent — no conversation thread expected. Human mental model: `claude -p` — get it done. The agent actions the request, then wraps the directive directly in a `[!DONE]-` callout with its reply inside. There is no `[!NOTE]+` stage.

User writes:

<!--claude-ignore-->
#claude can you clean up that formatting pls

Agent does the work, then converts to:

> [!DONE]- #claude can you clean up that formatting pls
>
> @claude: done — removed broken newlines and added missing periods at the end of sentences. No changes to text content.


<!--/claude-ignore-->
## Unresolved rule

A comment is unresolved when any of:

- An open callout `> [!NOTE]+ ...` whose **last line is from the user** (no agent reply yet, OR an agent replied earlier and the user has since posted a follow-up the agent hasn't answered).
- A shorthand form (`> @sam:`, `> sam:`, `@sam:`) that has not yet been upgraded.
- An inline `#agent` directive that has not yet been wrapped in a `[!DONE]-` callout.

If the **last non-blank speaker line is from the agent** — even when the agent's reply ends with a question back to the user — the thread is **parked**, waiting on the user. Don't self-reply.

A `> [!DONE]-` callout is resolved — leave it alone unless reopened.

## Resolution Contract

For each unresolved comment:

- Read the full file and enough surrounding context to understand the request.
- Use any better-matching skill/tool first when one applies.
- Do the requested work when it is concrete. For discussion comments, answer concisely.
- If the comment sits on a task item, update the checkbox too.

Then follow the path that matches the shape:

**Thread comments** (`[!NOTE]+` or shorthand forms):

- **Upgrade** any shorthand form to `> [!NOTE]+ @sam: ...` on first reply.
- **Reply** once below the original line as `> @agent: ...`, using the agent name the user would expect (`@codex`, `@claude`, `@pi`, `@hermes`, etc).
- **Separate speaker turns** with a blank quoted line (`>`) before each new speaker. Do not put `> @sam:` and `> @agent:` on adjacent lines; Obsidian renders them as one paragraph with an unstyleable `<br>`.
- **Pre-open user input** when your reply asks the human a question or needs another response: end with two blank quoted lines after your reply so the user can type on the final line.
  ```markdown
  > @claude: I need input from you to act — should I do #1 or #3?
  >
  >
  ```
- **Resolve** when the thread is done: change `[!NOTE]+` → `[!DONE]-` and write a one-line outcome summary as the callout title. Preserve the thread inside. **Title convention:** past-tense action + scope, ≤ ~60 chars. Examples:
    - `[!DONE]- trimmed intro to 3 bullets per @sam`
    - `[!DONE]- agreed on Tuesday migration kickoff`
    - `[!DONE]- kept queue worker in deployment section`

**Inline directives** (`#agent ...`):

- Action the request.
- **Wrap directly** into a `[!DONE]-` callout: one-line outcome summary as the title, the original `#agent` directive preserved as the first line inside, a blank quoted line, then your `@agent: done — ...` reply. No `[!NOTE]+` stage.

## The silent condition

ONLY if the user includes `#silent` in their comment: address it normally but leave **no trace**.

- Make the change.
- Remove the whole comment/directive — do not upgrade, do not reply.
- Do not sign off with `> @agent: ...`.

**If no concrete change can be made** (the request is ambiguous, missing context, or non-actionable): **break silent and escalate**. Leave the directive in place and add a normal `> @agent: ...` reply asking for clarification. The silent rule applies only when the change is clean and unambiguous; visible escalation is better than a silent no-op.

Example escalation:

> [!NOTE]+ #claude #silent tighten the wording above
> @claude: (I'm breaking silent because the request is ambiguous and that overrides). Blocking question: I can't tell which paragraph you mean — the wording above stretches back for 12,000 words but this seems like a narrower ask. Can you tell me if you mean 1) the last paragraph only 2) the last 2-3 paragraphs about this topic or 3) the entire document?
