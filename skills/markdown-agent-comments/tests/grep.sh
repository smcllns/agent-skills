#!/usr/bin/env bash
# Verify the scan grep documented in SKILL.md ("Scanning for comments to
# resolve") finds the right files. Run after changing the regex to make
# sure no fixtures regress.
#
#   Usage: bash tests/grep.sh

set -euo pipefail
DIR=$(mktemp -d)
trap 'rm -rf "$DIR"' EXIT

# ─── Fixtures ───────────────────────────────────────────────────────────
# Filename encodes the case; content reflects the shape. 8 should match,
# 8 should not — verifying both that real unresolved comments surface and
# that resolved / wrapped / midline / no-boundary cases don't.

printf '> [!NOTE]+ <cite>@sam</cite> active thread awaiting reply\n' > "$DIR/a-active-note.md"
printf '> [!NOTE]- <cite>@sam</cite> parked, awaiting human\n'       > "$DIR/b-parked-note.md"
printf '> [!DONE]- resolved thread\n'                                > "$DIR/c-resolved-done.md"
printf '#claude clean this up\n'                                     > "$DIR/d-bare-directive-claude.md"
printf '> [!DONE]- #claude already wrapped\n'                        > "$DIR/e-wrapped-directive.md"
printf '#claude-team please review\n'                                > "$DIR/f-hyphenated-directive.md"
printf '#claudewhatever not a directive (no word boundary)\n'        > "$DIR/g-no-boundary.md"
printf '  #claude indented (not at line start)\n'                    > "$DIR/h-indented.md"
printf '```text\n#claude inside a code block\n```\n'                 > "$DIR/i-in-codeblock.md"
printf '#agent please assist\n'                                      > "$DIR/j-agent-directive.md"
printf '#pi help me out\n'                                           > "$DIR/k-pi-directive.md"
printf '#piling false-positive risk for `pi`\n'                      > "$DIR/l-piling.md"
printf 'just regular markdown, nothing to find\n'                    > "$DIR/m-no-trigger.md"
printf 'see #claude for the rule (mid-line, not at start)\n'         > "$DIR/n-midline.md"
printf '#codex sanity check please\n'                                > "$DIR/o-codex.md"
printf '#hermes orchestrate this\n'                                  > "$DIR/p-hermes.md"

# ─── Expected matches ───────────────────────────────────────────────────
# `f` and `i` are accepted false positives — `\b` triggers on a hyphen
# after the agent name, and grep can't see fenced code blocks. The agent
# inspects the file anyway, so both are tolerable.

EXPECTED='a-active-note.md
d-bare-directive-claude.md
f-hyphenated-directive.md
i-in-codeblock.md
j-agent-directive.md
k-pi-directive.md
o-codex.md
p-hermes.md'

# ─── Run the grep documented in SKILL.md ────────────────────────────────
ACTUAL=$(grep -rlnE --include='*.md' '(\[!NOTE\]\+|^#(claude|codex|pi|agent|hermes)\b)' "$DIR" \
         | sed "s|^$DIR/||" | sort)

# ─── Assert ─────────────────────────────────────────────────────────────
if [ "$EXPECTED" = "$ACTUAL" ]; then
  echo "PASS: 16/16 fixtures behave as expected (8 match, 8 skip)"
else
  echo "FAIL — diff between expected and actual:"
  diff <(echo "$EXPECTED") <(echo "$ACTUAL") || true
  exit 1
fi
