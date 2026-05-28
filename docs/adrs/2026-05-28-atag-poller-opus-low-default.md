# ADR: atag poller defaults to Opus low effort for the current experiment

## Status

Accepted as an interim default.

## Context

The `atag` foreground poller is designed to spend no model tokens when there is no work: it first runs a cheap markdown scan and invokes Claude only when unresolved agent-tag work exists. That changes the default-model tradeoff. The expensive path happens only after the scanner has found something actionable, so the default should favor resolving the work correctly over minimizing the cost of no-op checks.

After run-3 testing exposed a model-quality question, we ran a small Anthropic-only bakeoff on the same fixture:

- run-3b: Haiku low effort.
- run-3c: Opus low effort.
- run-3d: Sonnet low effort.
- run-3e: Sonnet with no explicit `--effort`.

The fixture targeted the current highest-risk behavior: inline task/list tags. In particular, L3 required the agent to remove the live trigger from a task item, preserve the complete original task line verbatim as the first callout body line, update the task checkbox, and put the requested `config.yml`-shaped joke in the document body.

## Evidence

| Run | Model / effort | Duration | Budget used | Result |
|---|---:|---:|---:|---|
| 3b | Haiku low | 33.186s | `$0.07597265` | Failed L3 original-line preservation; produced prose instead of a YAML-shaped block. |
| 3c | Opus low | 43.563s | `$0.35496675` | Passed the fixture; preserved the original line, checked the task, wrote a YAML block, and did not respawn. |
| 3d | Sonnet low | 62.377s | `$0.18943515` | Failed L3 checkbox completion; preserved the original line and wrote a YAML block. |
| 3e | Sonnet default effort | 100.205s | `$0.18217650` | Passed the core fixture, but was slow and still had a small formatting-normalization miss. |

Trace sources:

- `~/.claude/projects/-Users-smcllns-Projects-skills-skills-atag-dev/d55b175e-39c3-4c46-a83f-e12c21888969.jsonl`
- `~/.claude/projects/-Users-smcllns-Projects-skills-skills-atag-dev/2c57f9ea-cae7-41fb-a019-714f3e1e788a.jsonl`
- `~/.claude/projects/-Users-smcllns-Projects-skills-skills-atag-dev/dc512ade-8d4e-4093-af63-379c5a007983.jsonl`
- `~/.claude/projects/-Users-smcllns-Projects-skills-skills-atag-dev/99232cea-81a3-4855-8cdf-41e3bdabf573.jsonl`

Local reproduction notes:

1. Reset `skills/atag/dev/fixture-run3.md` from `skills/atag/dev/fixture.td`.
2. Keep the run-goal sidecar out of the scan, or make sure it does not contain live trigger-looking lines.
3. Run:

```sh
cd /Users/smcllns/Projects/skills/skills/atag/dev
../scripts/atag-poll.sh --once --debug --response-style terminal -- --model opus --effort low --max-budget-usd 5
```

4. Verify a second scan is quiet:

```sh
../scripts/atag-poll.sh --once --debug --response-style terminal -- --model opus --effort low --max-budget-usd 5
```

## Decision

Set the `atag-poll.sh` default Claude invocation to:

```sh
claude -p --model opus --permission-mode acceptEdits --effort low
```

Callers may still override model and effort after `--`, for example `-- --model sonnet --effort low`.

## Consequences

- The default foreground terminal experience should be more reliable on currently known inline task/list cases.
- The default run is more expensive than Haiku or Sonnet on the run-3 fixture.
- The no-op path still costs no model tokens because the poller scans before invoking Claude.
- This is not a permanent model policy. It is a defensible interim default while we collect broader evidence.

## Follow-up

Run a fuller model/effort evaluation using the existing model-comparison harness plus the run-3 inline-task fixture shape. The follow-up should compare Anthropic models and supported effort levels across more cases before deciding whether Opus low remains the default.

Tracking issue: [#37](https://github.com/smcllns/skills/issues/37).
