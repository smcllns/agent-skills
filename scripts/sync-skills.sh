#!/usr/bin/env bash
# Copy each bare skill into every plugin tree that ships it.
#
# Model:
#   skills/<name>/                              ← canonical source of truth
#   <host>-plugins/<name>/skills/<name>/        ← derived copy (rsync target)
#
# Mapping rule: a plugin dir whose name matches <skill-name> gets that skill
# copied into its skills/<skill-name>/ subdir. To ship one skill under
# multiple plugins (or with renames), extend this script.
#
# No symlinks: marketplace tarballs, npm pack, and some installers strip or
# choke on symlinks. Real files copy cleanly across all hosts.
#
# Usage:
#   scripts/sync-skills.sh           Sync all skills into their plugin dirs.
#   CI runs this + `git diff --exit-code` to catch drift.

set -euo pipefail

repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"

plugin_roots=(claude-cowork-plugins codex-plugins)

shopt -s nullglob
synced=0

for skill_dir in skills/*/; do
  name="$(basename "$skill_dir")"
  for root in "${plugin_roots[@]}"; do
    plugin_dir="$root/$name"
    [[ -d "$plugin_dir" ]] || continue
    target="$plugin_dir/skills/$name"
    mkdir -p "$target"
    rsync -a --delete --exclude='.DS_Store' "$skill_dir" "$target/"
    echo "synced  $skill_dir → $target/"
    synced=$((synced + 1))
  done
done

echo
echo "$synced skill copies synced."
