# Agent Skills

Public copies of agent skills I use regularly.

The canonical working copies live in `dotfiles/skills`. This repository is a simple public mirror for skills that are useful to share.

## Available Skills

| Skill | Purpose |
| --- | --- |
| `markdown-comments` | Resolve human-authored comments in Markdown files using blockquote threads and inline agent directives. |

## Install

With the open `skills` CLI:

```bash
npx skills add smcllns/agent-skills --skill markdown-comments
```

For a global install to a specific agent:

```bash
npx skills add smcllns/agent-skills --skill markdown-comments --global --agent codex
npx skills add smcllns/agent-skills --skill markdown-comments --global --agent claude-code
```

With a GitHub CLI version that includes `gh skill`:

```bash
gh skill preview smcllns/agent-skills markdown-comments
gh skill install smcllns/agent-skills markdown-comments --agent codex --scope user
gh skill install smcllns/agent-skills markdown-comments --agent claude-code --scope user
```

Claude Code can also use the skill by placing this directory under `~/.claude/skills/markdown-comments`.

Claude.ai custom skills use uploaded zip files. Zip the `skills/markdown-comments` directory so the archive contains `SKILL.md` at its root.

## Updating This Mirror

From this repository:

```bash
mkdir -p skills/markdown-comments
cp ../dotfiles/skills/markdown-comments/SKILL.md skills/markdown-comments/SKILL.md
perl -0pi -e 's/^user-invocable:.*\n//m' skills/markdown-comments/SKILL.md
npx skills-ref validate skills/markdown-comments
npx skills add . --list
```

Commit and publish after the local discovery check succeeds.
