BEGIN {
  configured_agents = agents ? agents : "agent claude codex"
  split(tolower(configured_agents), names, /[ ,]+/)
  for (i in names) {
    if (names[i] != "") agent[names[i]] = 1
  }
}

FNR == 1 && NR > 1 {
  finish_callout()
}

function reset_callout() {
  in_done = 0
  callout_file = ""
  last_speaker = ""
  last_speaker_line = 0
}

function finish_callout() {
  if (in_done && last_speaker != "" && !(last_speaker in agent)) {
    print callout_file ":" last_speaker_line
  }
  reset_callout()
}

{
  line = $0

  if (line ~ /^[[:space:]]*>[[:space:]]*\[!DONE\]-/) {
    finish_callout()
    in_done = 1
    callout_file = FILENAME
    next
  }

  if (!in_done) next

  if (line !~ /^[[:space:]]*>/) {
    finish_callout()
    next
  }

  text = line
  sub(/^[[:space:]]*>[[:space:]]*/, "", text)

  if (text ~ /^@[[:alnum:]_-]+:/) {
    speaker = text
    sub(/^@/, "", speaker)
    sub(/:.*/, "", speaker)
    last_speaker = tolower(speaker)
    last_speaker_line = FNR
  }
}

END {
  finish_callout()
}
