---
name: obsidian-comments
description: "Resolve inline #claude/#codex comments in Obsidian notes by making the requested edits and replying in place. Also works with other agent tags and Markdown files."
---

# Obsidian Comments

Resolve `#claude`/`#codex` comments a human left in Obsidian notes. Work in place, preserve the conversation, and reply as the current agent. This also works in plain Markdown files and with other agent tags.

## Comment Shapes

**Blockquote thread** -- conversational feedback; reply in the same thread.
```markdown
> @sam: this section is too wordy -- can we simplify to a bullet list?
> @claude: Trimmed to 3 bullets and kept the tradeoffs inline in each.
```

**Inline hashtag comment** -- imperative prompt addressed to an agent. This is the primary use case.
```markdown
#claude pls clean up all this broken formatting from my copy paste?
#codex can you put the above into a table?
```

**Unresolved rule:** a comment is unresolved when the line(s) immediately after it are not a `> @agent:` reply. Treat `agent` as the assistant/tool doing the work.

## Resolution Contract

For each unresolved comment:

- Read the full file and enough surrounding context to understand the request.
- Use any better-matching skill/tool first when one applies.
- Do the requested work when it is concrete. For discussion comments, answer concisely.
- If the comment sits on a task item, update the checkbox too.
- Preserve the human's original comment, except for `#silent` comments.
- Reply once immediately below the comment as `> @agent: ...`, using the agent name the user would expect (`@codex`, `@claude`, `@pi`, `@hermes`, etc) and summarizing what changed or why no change was made.


## The silent condition

ONLY if the user includes the special keyword `#silent` in their comment, then the goal is to address the comment normally but leave no comment trace, so after making the change:

- Do not sign off with `> @agent ...`
- Remove the whole comment/directive, so only the change remains
- If no change can be made, request further direction from the user
