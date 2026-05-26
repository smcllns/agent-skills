# Markdown Agent Tags model comparison harness

Compares how Haiku, Sonnet, and Opus handle the `atag` skill on a single fixture of 9 graded test cases. Lets us pick a recommended default model for scheduled runs.

## Layout

```
fixture.md          The graded test cases (do not edit during a run)
run.sh              Harness: for each model, copies fixture → results/<model>.md, runs the skill, captures diffs
grade.md            Rubric + scoring grid template
results/            One result file per model run (gitignored)
```

## Running

```bash
./run.sh haiku-4.5 sonnet-4.6 opus-4.7
```

Each model gets a fresh copy of `fixture.md`, the skill is invoked with `claude -p --model <id>`, and the post-skill file is saved to `results/<model>.md`. The harness does not auto-grade — fill in `grade.md` by eyeballing the results.

## Rubric (per L1–L9)

Each case scores Y/N on the criteria that apply:

| | Detect | Preserve original verbatim | Title good (past tense, scope, ≤60ch) | Edit in body where applicable | Took a turn where applicable | Checkbox updated where applicable | No false-positive trigger | Resolved-thread skipped |
|---|---|---|---|---|---|---|---|---|
| L1 | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| L2 | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| L3 | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | — |
| L4 | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| L5 | ✓ | ✓ | — | — | ✓ | — | — | — |
| L6 | ✓ | ✓ | ✓ | ✓ | maybe | — | — | — |
| L7 | — | — | — | — | — | — | — | ✓ |
| L8 | — | — | — | — | — | — | ✓ | — |
| L9 | ✓ | ✓ | ✓ | — (discussion only) | — | — | — | — |

## Expected weak spots per model

- **Haiku 4.5** — strongest risk at L4 (oblique reference, requires distant edit) and L5 (resisting the temptation to guess on an ambiguous tag). May over-edit on L9 (write a body change instead of just answering in the callout).
- **Sonnet 4.6** — should pass L1–L4, L6, L8, L9 cleanly. L5 ambiguity-handling is the discriminator.
- **Opus 4.7** — expected ceiling. Used as the reference.

If Haiku passes 7+/9 it's the recommended default for scheduled runs (faster and cheaper). If it drops below 6/9 on first run, fall back to Sonnet.

## Notes

- The fixture is intentionally small enough that one run takes under a minute and the result file fits on one screen for comparison.
- `grade.md` is a fresh checklist per session — copy the table above into it, fill in Y/N, commit if you want a history.
