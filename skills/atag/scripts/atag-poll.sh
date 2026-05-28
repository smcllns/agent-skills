#!/usr/bin/env bash
set -euo pipefail

interval=60
target_dir="$PWD"
debug=0
once=0
timeout_seconds=1800
response_style=auto
user_name_arg=""

trigger_tokens=()
triggers=()
claude_args=()

usage() {
  cat >&2 <<'EOF'
usage: atag-poll.sh [options] [@trigger[, @trigger...]] [-- <claude args...>]

Options:
  --dir DIR             Directory to scan. Default: current directory.
  --interval SECONDS    Poll interval for foreground loop. Default: 60.
  --once                Run one scan cycle and exit.
  --debug               Print one-line no-match status and match diagnostics.
  --timeout SECONDS     Kill Claude after this many seconds. Default: 1800.
  --response-style MODE Claude output style: auto, terminal, or markdown. Default: auto.
  --name NAME           Human name the agent should use for speaker labels.
  --user-name NAME      Alias for --name.
  --claude-arg ARG      Pass one argument to Claude. Prefer -- for many args.
  -h, --help            Show this help.
EOF
}

die_usage() {
  echo "atag-poll: $*" >&2
  usage
  exit 2
}

require_value() {
  local flag="$1"
  local value="${2:-}"
  [[ -n "$value" ]] || die_usage "$flag requires a value"
}

positive_integer() {
  [[ "$1" =~ ^[0-9]+$ ]] && [[ "$1" -gt 0 ]]
}

label_from_name() {
  local raw="$1"
  local first label
  raw="${raw//$'\r'/ }"
  raw="${raw//$'\n'/ }"
  first="$(awk '{ print $1 }' <<< "$raw")"
  label="$(printf '%s' "$first" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9_]+/_/g; s/^_+//; s/_+$//')"
  [[ "$label" =~ [a-z] ]] || return 1
  [[ ! "$label" =~ ^[0-9] ]] || label="user_${label}"
  printf '%s' "$label"
}

label_is_trigger() {
  local label="$1"
  local trigger
  for trigger in "${triggers[@]}"; do
    [[ "$label" == "$trigger" ]] && return 0
  done
  return 1
}

fallback_missing_human_label() {
  local label n
  for label in user human person; do
    if ! label_is_trigger "$label"; then
      printf '%s' "$label"
      return
    fi
  done

  n=1
  while label_is_trigger "human_${n}"; do
    n=$((n + 1))
  done
  printf 'human_%s' "$n"
}

try_user_label() {
  local label="$1"
  local source="$2"
  if label_is_trigger "$label"; then
    return 1
  fi
  human_label="$label"
  human_label_source="$source"
  missing_human_name=0
}

resolve_user_label() {
  local candidate label

  if [[ -n "$user_name_arg" ]]; then
    label="$(label_from_name "$user_name_arg")" || die_usage "--name must contain at least one letter"
    if label_is_trigger "$label"; then
      die_usage "--name resolves to '${label}', which collides with an agent trigger label"
    fi
    try_user_label "$label" "--name"
    return
  fi

  if candidate="$(git -C "$target_dir" config user.name 2>/dev/null)" && label="$(label_from_name "$candidate")" && try_user_label "$label" "git config user.name"; then
    return
  fi

  if command -v gh >/dev/null 2>&1; then
    if candidate="$(GH_PROMPT_DISABLED=1 gh api user --jq 'if .name == null or .name == "" then .login else .name end' 2>/dev/null)" && label="$(label_from_name "$candidate")" && try_user_label "$label" "gh user"; then
      return
    fi
  fi

  if candidate="$(id -un 2>/dev/null)" && [[ "$candidate" != "root" ]] && label="$(label_from_name "$candidate")" && try_user_label "$label" "unix username"; then
    return
  fi

  human_label="$(fallback_missing_human_label)"
  human_label_source="fallback"
  missing_human_name=1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dir)
      require_value "$1" "${2:-}"
      target_dir="$2"
      shift 2
      ;;
    --interval)
      require_value "$1" "${2:-}"
      positive_integer "$2" || die_usage "--interval must be a positive integer"
      interval="$2"
      shift 2
      ;;
    --once)
      once=1
      shift
      ;;
    --debug)
      debug=1
      shift
      ;;
    --timeout)
      require_value "$1" "${2:-}"
      positive_integer "$2" || die_usage "--timeout must be a positive integer"
      timeout_seconds="$2"
      shift 2
      ;;
    --response-style)
      require_value "$1" "${2:-}"
      case "$2" in
        auto|terminal|markdown)
          response_style="$2"
          ;;
        *)
          die_usage "--response-style must be auto, terminal, or markdown"
          ;;
      esac
      shift 2
      ;;
    --name|--user-name)
      require_value "$1" "${2:-}"
      user_name_arg="$2"
      shift 2
      ;;
    --claude-arg)
      require_value "$1" "${2:-}"
      claude_args+=("$2")
      shift 2
      ;;
    --)
      shift
      while [[ $# -gt 0 ]]; do
        claude_args+=("$1")
        shift
      done
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    -*)
      die_usage "unknown option: $1"
      ;;
    *)
      trigger_tokens+=("$1")
      shift
      ;;
  esac
done

if [[ ! -d "$target_dir" ]]; then
  echo "atag-poll: directory not found: $target_dir" >&2
  exit 2
fi

target_dir="$(cd "$target_dir" && pwd -P)"

if [[ "${#trigger_tokens[@]}" -eq 0 ]]; then
  triggers=(agent claude codex)
else
  trigger_text="${trigger_tokens[*]}"
  if [[ ! "$trigger_text" =~ ^@[A-Za-z][A-Za-z0-9_]*(,[[:space:]]*@[A-Za-z][A-Za-z0-9_]*)*$ ]]; then
    echo "atag-poll: invalid trigger list: $trigger_text" >&2
    echo "atag-poll: use comma separation, e.g. @agento,@pi or @agento, @pi" >&2
    exit 2
  fi
  compact_triggers="$(printf '%s' "$trigger_text" | tr -d '[:space:]')"
  IFS=',' read -r -a parsed_triggers <<< "$compact_triggers"
  for trigger in "${parsed_triggers[@]}"; do
    triggers+=("${trigger#@}")
  done
fi

human_label=""
human_label_source=""
missing_human_name=0
resolve_user_label

join_by() {
  local IFS="$1"
  shift
  printf '%s' "$*"
}

trigger_alt="$(join_by '|' "${triggers[@]}")"
trigger_display=""
for trigger in "${triggers[@]}"; do
  if [[ -n "$trigger_display" ]]; then
    trigger_display+=", "
  fi
  trigger_display+="@${trigger}"
done

resolved_response_style="$response_style"
if [[ "$resolved_response_style" == "auto" ]]; then
  if [[ -t 1 ]]; then
    resolved_response_style=terminal
  else
    resolved_response_style=markdown
  fi
fi

echo "Watching for ${trigger_display} agent tags in ${target_dir}..."
echo ""
inline_scan_regex="^([^>]*[[:space:]])?@(${trigger_alt})([^[:alnum:]_]|$)"

callout_scan_awk='BEGIN {
  trigger_re = "(^|[[:space:]])@(" trigger_alt ")([^[:alnum:]_]|$)"
  agent_re = "^[[:space:]]*(\\*`(" trigger_alt ")`\\*|`(" trigger_alt ")`)([[:space:]]|:|$)"
  human_placeholder_re = "^[[:space:]]*(\\*`" human_label "`\\*|`" human_label "`):?[[:space:]]*$"
  missing_human_name_re = "^[[:space:]]*<!--atag:missing-human-name "
}
function finish_callout() {
  if (in_callout && has_trigger) {
    if (callout_type == "note" && !sealed && !agent_last) print callout_file ":" start
    if (callout_type == "done" && !sealed) print callout_file ":" start
  }
  in_callout = 0
  callout_type = ""
  has_trigger = 0
  sealed = 0
  agent_last = 0
  callout_file = ""
}
function start_callout(type) {
  in_callout = 1
  callout_type = type
  has_trigger = 0
  sealed = 0
  agent_last = 0
  callout_file = FILENAME
  start = FNR
}
function process_quoted_line() {
  line = $0
  sub(/^[[:space:]]*>[[:space:]]*/, "", line)
  if (line ~ trigger_re) has_trigger = 1
  if (line !~ /^[[:space:]]*$/ && line !~ human_placeholder_re && line !~ missing_human_name_re) {
    sealed = (line ~ /<!--atag:eot-->[[:space:]]*$/)
    agent_last = (line ~ agent_re)
  }
}
FNR == 1 && NR > 1 { finish_callout() }
/^[[:space:]]*>[[:space:]]*\[!NOTE\]\+/ {
  finish_callout()
  start_callout("note")
  process_quoted_line()
  next
}
/^[[:space:]]*>[[:space:]]*\[!DONE\]-/ {
  finish_callout()
  start_callout("done")
  process_quoted_line()
  next
}
!in_callout { next }
$0 !~ /^[[:space:]]*>/ { finish_callout(); next }
{
  process_quoted_line()
}
END { finish_callout() }'

cleanup_files=()

cleanup() {
  if [[ "${#cleanup_files[@]}" -gt 0 ]]; then
    for path in "${cleanup_files[@]}"; do
      [[ -n "$path" ]] && rm -f "$path"
    done
  fi
}

stop_loop() {
  cleanup
  exit 130
}

trap cleanup EXIT
trap stop_loop INT TERM HUP

new_temp() {
  local path
  path="$(mktemp -t atag-poll.XXXXXX)"
  cleanup_files+=("$path")
  printf '%s' "$path"
}

scan_matches() {
  local output="$1"
  local inline_matches callout_matches unique_matches mtime_matches
  inline_matches="$(new_temp)"
  callout_matches="$(new_temp)"
  unique_matches="$(new_temp)"
  mtime_matches="$(new_temp)"

  : > "$inline_matches"
  : > "$callout_matches"
  : > "$output"

  set +e
  grep -rlnE --include='*.md' "$inline_scan_regex" "$target_dir" > "$inline_matches"
  local grep_status=$?
  set -e
  if [[ "$grep_status" -ne 0 && "$grep_status" -ne 1 ]]; then
    echo "atag-poll: grep scan failed with status $grep_status" >&2
    return "$grep_status"
  fi

  find "$target_dir" -name '*.md' -exec awk -v trigger_alt="$trigger_alt" -v human_label="$human_label" "$callout_scan_awk" {} + > "$callout_matches"

  cat "$inline_matches" > "$unique_matches"
  awk '{ sub(/:[0-9]+$/, ""); print }' "$callout_matches" >> "$unique_matches"
  sort -u "$unique_matches" > "$mtime_matches"

  : > "$output"
  while IFS= read -r file; do
    [[ -n "$file" ]] || continue
    if mtime="$(stat -f '%m' "$file" 2>/dev/null)" || mtime="$(stat -c '%Y' "$file" 2>/dev/null)"; then
      printf '%s\t%s\n' "$mtime" "$file"
    else
      printf '0\t%s\n' "$file"
    fi
  done < "$mtime_matches" | sort -rn | cut -f2- > "$output"
}

build_prompt() {
  local matches="$1"
  local files
  local response_instruction
  local human_instruction
  files="$(sed "s#^${target_dir}/##; s#^#- #" "$matches")"
  if [[ "$resolved_response_style" == "terminal" ]]; then
    response_instruction="Response style: terminal plain text. Do not use Markdown tables. Output only changes made, active threads left unchanged, and changes you could not make."
  else
    response_instruction="Response style: Markdown. Output only changes made, active threads left unchanged, and changes you could not make."
  fi
  human_instruction="Human speaker label: \`${human_label}\` (source: ${human_label_source}). Use this label for human turns and label-only placeholders."
  if [[ "$missing_human_name" -eq 1 ]]; then
    human_instruction+="
No human name was detected. If you leave a [!NOTE]+ thread waiting on the human, prefill \`${human_label}\` and add this quoted HTML comment immediately after the label-only line:
> <!--atag:missing-human-name no human name detected; please ask the human what name agents should use and store it in AGENTS.md, git config user.name, or pass --name to atag-poll.sh.-->"
  fi
  cat <<EOF
Use the atag skill in the current working directory.

Trigger set: ${trigger_display}
${human_instruction}

${response_instruction}

The cheap pre-scan found unresolved tag work in:
${files}

Resolve unresolved atag work for that trigger set. If custom triggers were provided, they replace the default agent/claude/codex trigger set.
EOF
}

run_with_timeout() {
  local limit="$1"
  shift

  (
    cd "$target_dir"
    "$@"
  ) &
  local pid=$!

  (
    sleep "$limit"
    if kill -0 "$pid" 2>/dev/null; then
      kill -TERM "$pid" 2>/dev/null || true
      sleep 5
      kill -KILL "$pid" 2>/dev/null || true
    fi
  ) &
  local timer_pid=$!

  set +e
  wait "$pid"
  local status=$?
  set -e

  kill "$timer_pid" 2>/dev/null || true
  wait "$timer_pid" 2>/dev/null || true

  if [[ "$status" -eq 143 || "$status" -eq 137 ]]; then
    echo "atag-poll: claude timed out after ${limit}s" >&2
    return 124
  fi

  return "$status"
}

run_claude() {
  local prompt="$1"
  local cmd=(claude -p --model sonnet --permission-mode acceptEdits)
  if [[ "${#claude_args[@]}" -gt 0 ]]; then
    cmd+=("${claude_args[@]}")
  fi
  cmd+=("$prompt")

  if [[ "$debug" -eq 1 ]]; then
    printf 'atag-poll: invoking'
    printf ' %q' "${cmd[@]}"
    printf '\n\n'
  fi >&2

  run_with_timeout "$timeout_seconds" "${cmd[@]}"
}

run_once() {
  local matches
  matches="$(new_temp)"
  scan_matches "$matches"

  if [[ ! -s "$matches" ]]; then
    if [[ "$debug" -eq 1 ]]; then
      printf '[%s]  No %s agent tags detected\n' "$(date +%H:%M)" "$trigger_display"
    fi
    return 0
  fi

  if [[ "$debug" -eq 1 ]]; then
    local count
    count="$(wc -l < "$matches" | tr -d '[:space:]')"
    echo "atag-poll: found ${count} matched file(s) in $target_dir for ${trigger_display}" >&2
    echo >&2
    sed 's/^/atag-poll: match /' "$matches" >&2
  fi

  local prompt
  prompt="$(build_prompt "$matches")"
  run_claude "$prompt"
}

while true; do
  run_once
  status=$?

  if [[ "$status" -ne 0 ]]; then
    exit "$status"
  fi

  if [[ "$once" -eq 1 ]]; then
    exit 0
  fi

  sleep "$interval"
done
