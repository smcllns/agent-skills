# scan.awk — find markdown files with unresolved agent-addressed comments.
# Used by the markdown-agent-comments skill (see SKILL.md).
#
# Prints the path of each matching file (one per line) and advances to the
# next file via `nextfile` on first hit. Tracks the previous line via `prev`
# so shorthand (`> @sam:`) only fires at top level — never inside an
# existing callout or blockquote.
#
# Invoke as:
#   find <path> -name '*.md' -exec awk -f reference/scan.awk {} +

FNR == 1 { prev = "" }

# Active callout — `[!NOTE]+`, bare `[!NOTE]`, or any marker except `-`.
/\[!NOTE\]([^-]|$)/ { print FILENAME; nextfile }

# Inline directive — `#claude` (etc) at line-start, indented, or mid-prose.
# `([^[:alnum:]_]|$)` is the awk-portable equivalent of `\b` after the
# agent name (macOS awk doesn't support `\b`).
/^([^>]*[[:space:]])?#(claude|codex|pi|agent|hermes)([^[:alnum:]_]|$)/ { print FILENAME; nextfile }

# Top-level human shorthand — `> @sam:` or `@sam:` at the start of a line.
# Only fires when the previous line is not a blockquote line, so agent
# reply lines inside existing callouts (`> @claude: ...`) are ignored.
prev !~ /^>/ && /^>?[[:space:]]*@[[:alnum:]_-]+:/ { print FILENAME; nextfile }

{ prev = $0 }
