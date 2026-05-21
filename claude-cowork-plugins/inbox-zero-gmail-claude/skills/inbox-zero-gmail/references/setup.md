# First-time setup

Two things to get in place before the first triage: the Cowork Gmail connector with the right permissions, and the user's own `policy.md`.

## 1. Connect Gmail in Cowork

Open **Customize → Connectors → Gmail** and connect the account.

Then set tool permissions. **The skill is unusable without write access to labels** — the connector's default permission set is too restrictive.

*Always allow*:
- `search_threads`, `get_thread`, `list_labels` — read-only
- `label_thread`, `unlabel_thread` — needed for category labels, ACTION/FYI, and archiving
- `create_draft` — needed for drafts

*Never*: anything that sends email.

*Ask first* or *Never*: `create_label`, `delete_label`, `update_label` — the skill assumes the canonical label set already exists and shouldn't create or destroy labels.

*Optional*: `label_message`, `unlabel_message` — only if you want per-message granularity.

## 2. Install the plugin

Install the plugin via marketplace add (`claude plugin marketplace add smcllns/skills`) or via the Cowork UI. The SessionStart hook seeds `${CLAUDE_PLUGIN_DATA}/policy.md` from `user/policy.example.md` automatically on first run — no manual copy step needed.

## 3. Customize the policy

After first run, edit `${CLAUDE_PLUGIN_DATA}/policy.md` to fit the user. The structure is already there; you're collecting the specifics:

- Newsletters they actually read (vs. SaaS marketing)
- Family and care-team domains
- Kids' platforms (school, sports, gaming)
- Regular billers (banks, brokerages, subscriptions)
- The spam patterns to junk on sight

Once `policy.md` reflects the user, run a small first triage (~20 threads) and confirm classifications with the user to seed the correction log.
