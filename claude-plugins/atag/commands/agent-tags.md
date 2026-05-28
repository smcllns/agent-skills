---
name: agent-tags
description: Check or sweep agent tags in markdown
argument-hint: "check|sweep [paths...] [options]"
allowed-tools: [Read, Edit, MultiEdit, Grep, Glob, Bash, Skill]
---

# Agent Tags

Arguments: `$ARGUMENTS`

Use this as the Claude command surface for Markdown Agent Tags (`atag`).

## Command shape

- `/agent-tags check [--dir <path>] [--list] [@trigger...]`
- `/agent-tags sweep [path...] [--resolved|--all] [--trace|--t0] [--dry-run]`

Reject unsupported flags briefly and show the supported shape above.

## `check`

Use the `atag` skill. `check` means "look for actionable tags."

Arguments:

- Default target directory: current working directory.
- `--dir <path>` sets the target directory or file.
- `@name` arguments replace the default triggers. Example: `@pi @hermes`.
- `--list` scans and reports actionable tags only. Do not edit files.

Behavior:

1. Load or follow the `atag` skill.
2. Scan the target for unresolved agent tags and active threads.
3. With `--list`, report matching files and line numbers.
4. Without `--list`, handle each actionable tag per the skill:
   - Edit the document body when the tag asks for a concrete change.
   - Keep the callout reply short.
   - Preserve the original request in the thread.
   - End agent replies with `<!--atag:eot-->`.

## `sweep`

Sweep Markdown Agent Tags threads out of the reading flow.

Defaults:

- Target: paths from arguments, or current working directory if no path is given.
- Scope: `--resolved`
- Trace mode: `--trace`

Arguments:

- `--resolved` / `-r`: sweep only sealed `[!DONE]-` callouts.
- `--all` / `-a`: sweep `[!NOTE]+` and all `[!DONE]-` callouts.
- `--trace` / `-t`: replace each swept callout with a markdown footnote reference.
- `--t0`: remove swept callouts from context with no inline marker.
- `--dry-run`: report what would change, but do not edit files.

Matching rules:

- A callout block starts on a blockquote line matching `> [!NOTE]+` or `> [!DONE]-`.
- The block continues through following contiguous blockquote lines.
- For `--resolved`, include only `[!DONE]-` blocks whose latest nonblank quoted line ends with `<!--atag:eot-->`.
- For `--all`, include `[!NOTE]+` blocks and all `[!DONE]-` blocks, sealed or unsealed.
- Do not sweep plain `[!NOTE]`, `[!NOTE]-`, `[!DONE]`, or `[!DONE]+` callouts.

Rewrite rules:

- Before editing a file, reread its current contents.
- If `--dry-run` is present, report counts and targets without editing.
- Before assigning archive IDs, scan existing `agent-tags-N` footnotes and headings in the file and choose the next unused positive integer.
- If `--trace`, replace each swept callout with a unique footnote reference like `[^agent-tags-1]`.
- If `--t0`, remove each swept callout with no in-context marker.
- Append archived threads under `## Agent Tags Archive` at the end of the file, or append to that section if it already exists.
- For `--trace`, archive entries are markdown footnote definitions.
- For `--t0`, archive entries are normal appendix entries.
- Preserve the original callout text exactly inside a `markdown` code fence.

Footnote archive shape for `--trace`:

````markdown
[^agent-tags-1]: Archived agent tag thread.

    ```markdown
    > [!DONE]- example
    >
    > `claude`: done. <!--atag:eot-->
    ```
````

Appendix archive shape for `--t0`:

````markdown
### agent-tags-1

```markdown
> [!DONE]- example
>
> `claude`: done. <!--atag:eot-->
```
````

Keep the final response brief: files changed, number of tags checked or threads swept, mode used, and any unresolved questions.
