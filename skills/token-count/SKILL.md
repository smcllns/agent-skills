---
name: token-count
description: "Count tokens in a file using the Claude tokenizer. Use when you need an accurate token count for prompt budgeting, skill sizing, or annotating file references (e.g. '[file.md](url) (~1000 tokens)')."
---

# Token count

```sh
tokens <file>
```

Returns the exact Claude tokenizer count. Shell function in `~/.zshrc` that calls Anthropic's free `/v1/messages/count_tokens` endpoint — no model inference, no cost, no local Python deps.

## Setup (if `tokens` is missing on this machine)

Requires `jq`, `curl`, `op` (1Password CLI), and a 1Password service-account token at `~/Agents/.secrets/op-service-account.token` with read access to the "Yolo Sam" vault.

Add to `~/.zshrc`:

```sh
# count tokens in a file using the Claude tokenizer (Anthropic /v1/messages/count_tokens; free)
# Usage: tokens <file>
tokens() {
  local file="${1:?usage: tokens <file>}" key
  key=$(OP_SERVICE_ACCOUNT_TOKEN=$(cat ~/Agents/.secrets/op-service-account.token) \
    op read "op://Yolo Sam/526jvoz52bhelcv5gaiytsxq24/credential") || return 1
  jq -Rs --arg model "claude-haiku-4-5" \
    '{model:$model, messages:[{role:"user", content:.}]}' "$file" \
  | curl -s https://api.anthropic.com/v1/messages/count_tokens \
      -H "x-api-key: $key" \
      -H "anthropic-version: 2023-06-01" \
      -H "content-type: application/json" --data-binary @- \
  | jq -r '.input_tokens // "error: \(.error.message // tostring)"'
}
```

`526jvoz52bhelcv5gaiytsxq24` is the UUID of the "Anthropic API key (yolo)" item — parens in the title break `op read`, so reference by UUID. Look up via `op item list --vault "Yolo Sam" --format json | jq` if it ever changes.

## Why this approach

- **Claude tokenizer accuracy** — `tiktoken cl100k_base` underestimates Anthropic counts by ~15–20% on markdown (e.g. SKILL.md reported 835 vs. actual 1006).
- **No local Python deps** — avoids the PyPI supply-chain surface; Sam's `npm-age-proxy`-equivalent for `uv` is still being designed.
- **Free `count_tokens` endpoint** — does only tokenization, no model inference, no charge. Earlier OpenRouter-based variant cost ~$0.001/call because it triggered a real (minimal) chat completion to read `usage.prompt_tokens` back.
- **`claude-haiku-4-5` model field** — the tokenizer is shared across all Claude models, so the model field is just routing metadata. Any current Claude model name works.
