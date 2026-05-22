#!/usr/bin/env bash
# md-asks — model comparison harness.
#
# Usage:
#   ./run.sh haiku-4.5 sonnet-4.6 opus-4.7
#   ./run.sh haiku                              # single model
#
# For each model passed as an arg, copies fixture.md to results/<model>.md,
# then invokes `claude -p --model <model>` asking it to resolve all md-asks
# directives in that file. Inspect the result files by eye.

set -euo pipefail

cd "$(dirname "$0")"

if [[ $# -eq 0 ]]; then
  echo "usage: $0 <model> [<model>...]" >&2
  echo "       e.g. $0 haiku-4.5 sonnet-4.6 opus-4.7" >&2
  exit 2
fi

mkdir -p results

for model in "$@"; do
  out="results/${model}.md"
  cp fixture.md "$out"

  abs_out="$(cd "$(dirname "$out")" && pwd)/$(basename "$out")"

  echo "─── ${model} ──────────────────────────────"
  echo "  fixture → ${abs_out}"
  echo "  invoking claude --model ${model}..."

  claude -p --model "$model" "Run the md-asks skill on the file at ${abs_out} — resolve every unresolved ask in that single file. Do not touch any other files."

  echo "  result written to ${abs_out}"
  echo
done

echo "Done. Diff results side-by-side, then score against the rubric in README.md."
