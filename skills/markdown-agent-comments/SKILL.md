---
name: markdown-agent-comments
description: "Use when an Obsidian note or other markdown file contains inline comments addressed to agents with `> @human:` syntax, or `> [!NOTE]+ @commenter:` callouts, or `#claude`/`#codex`/`#agent` directives."
---

# Markdown Comments

Resolve comments a human left for an agent in markdown files. Work in place, preserve the thread, and reply as the current agent.

## Comment Shapes

<!--#agents ignore: example comments in this file are to illustrate the protocol; do not process them-->

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

### Human shorthand input

Human friendly shorthands, such as: 

- `> @sam: ...`,
- `> sam: ...`,
- `@sam: ...` 

should **upgrade to `> [!NOTE]+ @sam: ...` on first touch**. 

Bare `sam: ...` (no `@`, no `>`) is **not** a comment — ignore.

### Inline directive (non-interactive)

One-shot imperative addressed to a specific agent — no conversation thread expected. The agent actions the request, then wraps the directive directly in a `[!DONE]-` callout with its reply inside. There is no `[!NOTE]+` stage.

User writes:

#claude can you clean up that formatting pls

Agent does the work, then converts to:

> [!DONE]- #claude can you clean up that formatting pls
>
> @claude: done — removed broken newlines and added missing periods at the end of sentences. No changes to text content.

Human mental model: this is like `claude -p` mode for these comments — complete the ask without further human input.

**If no concrete change can be made** (the request is ambiguous, missing context, or non-actionable), then add a normal `> @agent: ...` reply asking for clarification and escalate to your human for input through normal channels.

Example escalation:

> [!NOTE]+ #claude tighten the wording above
> @claude: Breaking protocol because the request is ambiguous: I can't tell which paragraph you mean — the wording above stretches back for 12,000 words but your ask seems like a smaller one. Please confirm where to stop: (1) the last paragraph only (2) the last 4 paragraphs that cover this topic or (3) the entire document (all 12,000 words)?

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
- **Separate speaker turns** with a blank quoted line (`>`) before each new speaker. Do not put `> @sam:` and `> @agent:` on adjacent lines; renderers collapse them into one paragraph with an unstyleable `<br>`.
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

