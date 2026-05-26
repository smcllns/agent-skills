---
name: atag
description: "Use when markdown files (Obsidian notes or regular .md) contain `@claude`, `@codex`, `@agent`, or user-specified `@trigger` tags. Also use when asked to resolve agent tags in markdown, scan for @agent comments, or process open `[!NOTE]+` threads."
---

# Markdown Agent Tags

**Markdown Agent Tags** (`atag`) lets you leave `@agent` tags in markdown files for an AI agent to pick up asynchronously.

A human writes `@codex do X` or `@claude do X` in a markdown file. This skill resolves the tag and records the exchange in a callout thread.

## Example

User writes:

```
@codex can you clean up that formatting pls
```

After the agent acts:

```
> [!DONE]- cleaned up broken formatting
>
> @codex can you clean up that formatting pls
>
> `codex`: done — removed broken newlines and added missing periods. No changes to text content. <!--atag:eot-->
```

The original tag is preserved verbatim as the first body line. The title is the outcome summary.

## Tag shapes

| Pattern | Status | Scan | Agent behavior |
|---|---|---|---|
| `@agent`, `@claude`, `@codex` | New | Picks up | New tag, action required. |
| `@<custom>` | New | Picks up if the caller specified custom triggers | New tag, action required. |
| `[!NOTE]+` | Active thread | Picks up | If the human spoke last, act. If the agent spoke last, leave it. |
| `[!DONE]-` | Resolved thread | Grep skips; DONE seal scan checks | If the thread is not sealed with `<!--atag:eot-->`, inspect and reseal. Legacy `<!--md-asks:eot-->` seals also count as sealed. |

TODO: Remove legacy `<!--md-asks:eot-->` support once Sam's vaults and installed plugin caches have zero remaining matches.

The `+/-` marker is load-bearing:
- `[!NOTE]+` distinguishes agent threads from regular callouts.
- `[!DONE]-` collapses the callout in Obsidian.

## Discussion thread format

Inside an active callout, separate turns with a **single blank `>` line** — one paragraph per turn.

Use `@name` only for trigger tags. Speaker labels use inline code:

- Agent turn: `` `claude`: reply``.
- Human turn: ``*`sam`*: reply``.

In `[!DONE]-` threads, a human can add follow-up text directly after the `<!--atag:eot-->` token; the next agent pass will inspect and reseal.

```markdown
> [!DONE]- tightened introduction
>
> @claude tighten the intro
>
> `claude`: trimmed to 3 sentences — does that read OK or want to go shorter?
>
> *`sam`*: shorter please, ~1 sentence
>
> `claude`: done — single sentence. <!--atag:eot-->
> no, make it sharper
```

For a soft line break inside a single turn, use two trailing spaces.

## Unresolved rule

A tag is unresolved when any of:

- An open `> [!NOTE]+ ...` callout whose last reply is from the user.
- A valid inline tag for a recognized trigger not yet processed into a callout.
- A resolved `> [!DONE]- ...` callout whose latest nonblank quoted line does not end with `<!--atag:eot-->` or legacy `<!--md-asks:eot-->`.

## Resolution contract

For each unresolved tag:

- Read the file and enough surrounding context to understand the request.
- Use any better-matching skill/tool first when one applies.
- Do the requested work when it is concrete — edit the **document body**, not the callout. The callout gets a one-line acknowledgement; the actual change goes where the user asked for it.
- For discussion-only tags (no doc change requested), answer concisely inside the callout.
- If the tag sits on a task item, update the checkbox too.
- **Never remove or modify the original tag.** It must appear verbatim as the first body line of the resulting callout, in both `[!DONE]-` and `[!NOTE]+` cases.

**Conclude** with `[!DONE]-` and a one-line outcome summary as the title (past-tense action + scope, ≤~60 chars) once the work is genuinely complete. End the final agent reply with `<!--atag:eot-->`.

**Take a turn** with `[!NOTE]+` if completion requires further input from the human, so the thread stays visually open.

## If further human input required

When the tag is ambiguous, missing context, or non-actionable, **don't guess**. Wrap with `[!NOTE]+`, keep the original tag as the first body line, and add a clarifying question:

```
> [!NOTE]+ awaiting clarification
>
> @claude tighten the wording above
>
> `claude`: the wording above stretches back 12,000 words but your request sounds smaller. Confirm: (1) the last paragraph, (2) the last 4 paragraphs on this topic, or (3) the full doc.
```

## Scanning for unresolved tags

Scan in two passes. Sort matched files by mtime descending before capping.

1. **Grep for new and active threads** — cheap single-line scan for inline tags and `[!NOTE]+` callouts.

```sh
grep -rlnE --include='*.md' '(\[!NOTE\]\+|^([^>]*[[:space:]])?@(agent|claude|codex)([^[:alnum:]_]|$))' <path>
```

Default agent names are `agent claude codex`. For custom triggers, replace `?@(agent|claude|codex)` with the custom alternation, e.g. `?@(nora|hermes)`.

2. **Inline awk to check DONE threads for missing seals** — multiline scan for `[!DONE]-` callouts whose latest nonblank quoted line does not end with `<!--atag:eot-->` or legacy `<!--md-asks:eot-->`.

```sh
find <path> -name '*.md' -exec awk '
function finish_done() {
  if (in_done && !sealed) print callout_file ":" start
  in_done = 0
  sealed = 0
  callout_file = ""
}
FNR == 1 && NR > 1 { finish_done() }
/^[[:space:]]*>[[:space:]]*\[!DONE\]-/ {
  finish_done()
  in_done = 1
  sealed = 0
  callout_file = FILENAME
  start = FNR
}
!in_done { next }
$0 !~ /^[[:space:]]*>/ { finish_done(); next }
{
  line = $0
  sub(/^[[:space:]]*>[[:space:]]*/, "", line)
  if (line !~ /^[[:space:]]*$/) {
    sealed = (line ~ /<!--(atag|md-asks):eot-->[[:space:]]*$/)
  }
}
END { finish_done() }
' {} +
```

## Tests

[`reference/markdown-agent-tags.spec.md`](reference/markdown-agent-tags.spec.md) documents scan edge cases, accepted false positives, and test fixtures.

**Smoke test after setup:** create a scratch `.md` file with a simple `@codex` tag, run the skill against that folder, and confirm the tag is wrapped in a sealed callout. Then add a human `> ...` follow-up after the `<!--atag:eot-->` token and run again; it should be picked up.

Contributor regression test: run `bun test` after changing scan commands, agent defaults, callout markers, or files under `reference/`.

## Final message

By default, keep the last assistant message brief and easy to override.

If there are no changes, use one line: `Scanned N files in <path>. No open unresolved @<triggers> tags detected.`

If there are changes or human input is required, provide a clear, concise executive update with links to changed files and line numbers/anchors when available. Follow any user-specified summary format over this default.

## Best practices

**Scheduled runs should exit asap.** When wrapping this skill in a scheduled task, gate the run on the Scanning grep and exit immediately if it returns empty — don't invoke the skill on no-op runs.

**Don't prematurely limit results.** Actionable threads cluster in recently-touched files — sort matches by file mtime descending. If you must, cap after sorting.

**Callout is for discussion, not the work.** Edits go in the **document body**; the callout is a side thread for discussion and one-line acknowledgements of the changes made. Don't paste rewritten paragraphs, drafted sections, or new code into the reply — that belongs in the body. Discussion-only tags (e.g. `@claude why did we pick X?`) have no body edit, so the answer is the reply.

**Proactively correct formatting.** Allow the human to write shorthand imperfectly, and normalize speaker labels to the inline-code format when you touch a thread.

**Reply using familiar agent name.** Use the agent name the user expects in your context (`` `claude`: ...``, `` `codex`: ...``, `` `pi`: ...``, `` `hermes`: ...``, etc).

**Don't self-reply.** If the most recent speaker label in a `[!NOTE]+` thread is your agent label (for example `` `claude`:``), the thread is waiting on the human. Leave it. If the same thread keeps showing up across scans with no human movement, mention it to the user.
