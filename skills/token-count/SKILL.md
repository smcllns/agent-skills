---
name: token-count
description: "Use when you need a free, accurate token count for prompt budgeting, skill sizing, or annotating file references (e.g. '[SKILL.md](url) (~625 tokens)') without local tokenizer deps."
---

# Token count

Server-side token counting endpoints:

- **Anthropic** — `POST https://api.anthropic.com/v1/messages/count_tokens` (`x-api-key`, free)
- **Gemini** — `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:countTokens` (API key, free)
- **OpenAI** — `POST https://api.openai.com/v1/responses/input_tokens` (`Bearer`, free)

These endpoints don't trigger model inference — they just tokenize. Match the tokenizer to the target model (counts differ across vendors). No local tokenizer deps needed.

Why not tiktoken? It's OpenAI-only — counts differently to Claude/Gemini (15–20% count differences). Use it locally if your target is GPT; use these endpoints for cross-vendor accuracy or to avoid local tokenizer deps.
