#!/usr/bin/env bash
# tests/grep.sh — verifies the scan grep documented in SKILL.md against a
# fixture set.
#
# The regex is PARSED from SKILL.md at runtime (not hardcoded) so the test
# can never drift from the documentation: if you change the regex in
# SKILL.md, this test runs the new regex. Per-agent fixtures are generated
# dynamically from the agent-name alternation in the regex, so adding a
# new agent there automatically extends test coverage.
#
# Usage: bash tests/grep.sh

set -euo pipefail
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
SKILL=$SCRIPT_DIR/../SKILL.md

[ -f "$SKILL" ] || { printf 'FAIL: %s not found\n' "$SKILL" >&2; exit 1; }

# Parse the regex out of the documented command in SKILL.md. Expects the
# doc to use the form: grep -rlnE --include='*.md' '<regex>'
REGEX=$(sed -nE "s/.*grep -rlnE --include='\*\.md' '([^']+)'.*/\1/p" "$SKILL" | head -1)
[ -n "$REGEX" ] || { printf 'FAIL: could not extract regex from SKILL.md — has the doc command changed shape?\n' >&2; exit 1; }

# Extract agent names from the `^#(name1|name2|…)` alternation inside the regex.
AGENTS=$(printf '%s' "$REGEX" | sed -nE 's/.*\^#\(([^)]+)\).*/\1/p' | tr '|' ' ')
[ -n "$AGENTS" ] || { printf 'FAIL: could not extract agent names from regex: %s\n' "$REGEX" >&2; exit 1; }

printf 'Regex:  %s\n' "$REGEX"
printf 'Agents: %s\n' "$AGENTS"

DIR=$(mktemp -d)
trap 'rm -rf "$DIR"' EXIT

# ─── Static fixtures (independent of agent-name list) ──────────────────
printf '> [!NOTE]+ <cite>@sam</cite> active thread awaiting reply\n' > "$DIR/a-active-note.md"
printf '> [!NOTE]- <cite>@sam</cite> parked, awaiting human\n'       > "$DIR/b-parked-note.md"
printf '> [!DONE]- resolved thread\n'                                > "$DIR/c-resolved-done.md"
printf '> [!DONE]- #claude already wrapped\n'                        > "$DIR/e-wrapped-directive.md"
printf '#claude-team please review\n'                                > "$DIR/f-hyphenated-directive.md"
printf '#claudewhatever not a directive (no word boundary)\n'        > "$DIR/g-no-boundary.md"
printf '  #claude indented (not at line start)\n'                    > "$DIR/h-indented.md"
printf '```text\n#claude inside a code block\n```\n'                 > "$DIR/i-in-codeblock.md"
printf '#piling false-positive risk for `pi`\n'                      > "$DIR/l-piling.md"
printf 'just regular markdown, nothing to find\n'                    > "$DIR/m-no-trigger.md"
printf 'see #claude for the rule (mid-line, not at start)\n'         > "$DIR/n-midline.md"

# ─── Per-agent fixtures: one bare directive per name in the regex ──────
for agent in $AGENTS; do
  printf '#%s please assist\n' "$agent" > "$DIR/agent-$agent-bare.md"
done

# ─── Expected matches ──────────────────────────────────────────────────
# Static matches: `a` (open NOTE+), `f` (hyphen triggers \b — accepted FP),
# `i` (in fenced block — grep doesn't parse fences, accepted FP). Plus one
# per agent name in the regex.
EXPECTED=$( {
  printf 'a-active-note.md\n'
  printf 'f-hyphenated-directive.md\n'
  printf 'i-in-codeblock.md\n'
  for a in $AGENTS; do printf 'agent-%s-bare.md\n' "$a"; done
} | sort )

# ─── Run the parsed regex over the fixtures ────────────────────────────
ACTUAL=$(grep -rlnE --include='*.md' "$REGEX" "$DIR" | sed "s|^$DIR/||" | sort)

# ─── Assert ────────────────────────────────────────────────────────────
if [ "$EXPECTED" = "$ACTUAL" ]; then
  TOTAL=$(ls "$DIR" | wc -l | tr -d ' ')
  MATCHED=$(printf '%s\n' "$EXPECTED" | wc -l | tr -d ' ')
  printf 'PASS: %s fixtures, %s matched as expected\n' "$TOTAL" "$MATCHED"
else
  printf 'FAIL — diff between expected and actual:\n' >&2
  diff <(printf '%s\n' "$EXPECTED") <(printf '%s\n' "$ACTUAL") || true
  exit 1
fi
