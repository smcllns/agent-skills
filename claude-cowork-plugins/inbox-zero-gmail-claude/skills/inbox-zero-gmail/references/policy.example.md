# My Inbox Preferences

This is a starter template. Copy this file to `policy.md` (alongside it, in the same `user/` directory) and replace the examples with your own senders, rules, and training notes. Keep the structure — the agent uses it to make consistent decisions.

## Labels

### Category

Categorize emails using exactly one label (priority order — first match wins):

1. 👋 **People** — Messages from real humans you know: family, friends, healthcare providers, personal contacts
2. 🔒 **Security** — Login alerts, 2FA, verification codes, magic links, password-free sign-in links, data leak alerts
3. 📆 **Calendar** — Appointments, reservations, scheduling, reminders, trip confirmations
4. 💳 **Money** — All transactions: receipts, invoices, statements, refunds, shipping, deliveries, subscriptions, tax docs, banking
5. 👶 **Kids** — Anything about your children: school, sports, kid accounts, parenting platforms (delete this category if it doesn't apply to you)
6. 📰 **News** — Newsletters you actively subscribe to and value (list them below)
7. 🛠️ **Dev** — GitHub, npm, deployment platforms, CI/CD, cloud billing, developer tools (delete if it doesn't apply to you)
8. 📣 **Noise** — Marketing, promos, TOS updates, feature announcements, service notices — legitimate but unwanted
9. 🗑️ **Junk** — Spam, scams, phishing, misdirected emails, suspicious domains
10. 🗂️ **Other** — Unclear, needs your input

### Action type

In addition to (not instead of) a category label:

- 🔴 **ACTION** — You must respond, decide, or act
- 🟡 **FYI** — Should read/reference soon, no action needed

### The rule

1. **Add exactly one category label** (always, no exceptions)
2. **Add ACTION or FYI if applicable** (most emails get neither)
3. **ACTION or FYI → stays in inbox** (so you see it)
4. **Neither → archive** (remove from inbox, keep the category label for findability)

## Sender rules

<!-- First-match wins. Add specific sender/domain rules here before they fall through to general category logic. -->

### People
- `<your-doctor-domain.example>` with "message from your care team" or "test results" → People / FYI
- Voicemail transcripts from named contacts → People / FYI

### Security
- `<your-sso-provider.example>` sign-in confirmation emails → Security / FYI
- Data leak alerts (e.g. Have I Been Pwned) → Security / ACTION
- OTP codes and magic links → Security / FYI

### Calendar
- `<your-healthcare-portal.example>` with "appointment reminder" → Calendar / FYI
- Travel booking confirmations (airline, hotel, rental) → Calendar / FYI
- Dental/medical appointment confirmations → Calendar / FYI

### Money
- Receipts and statements from your regular billers (list them: bank, brokerage, recurring subscriptions, e-commerce) → Money
- Order confirmations from major retailers → Money / archive
- Delivery notifications when you already get push notifications → Noise / archive

### Kids
- Your kids' school domain → Kids / FYI
- Sports/activity platforms (list them) → Kids / archive unless schedule change (FYI)
- Kid-account notifications (gaming, learning apps) → Kids / archive

### News (valued newsletters)
- List the newsletters you actually read here, by email address:
  - `<newsletter1@example.com>` — what they cover
  - `<newsletter2@example.com>` — what they cover
- Anything not on this list → Noise, not News

### Dev (delete this section if it doesn't apply to you)
- GitHub notifications → Dev
- Deployment alerts on failure → Dev / FYI
- Cloud billing alerts → Dev / FYI
- Security advisories from package managers → Dev / FYI

### Noise
- SaaS onboarding emails (new account confirmations for services you signed up for) → Noise
- Nextdoor / neighborhood digests → Noise
- Loyalty program promos (Starbucks, airline miles, etc.) → Noise
- TOS/policy updates from services you use → Noise
- Feature announcements → Noise

### Junk
- Sender addresses with random strings or suspicious domains → Junk
- Generic recruiter spam from unrecognized agencies → Junk
- Anything from a domain that doesn't look like the brand it claims to be (phishing) → Junk

## Actionability defaults

- Security codes / magic links → **FYI** (you requested them, just need quick access)
- Delivery confirmations → **archive** (push notifications already cover this)
- Healthcare care team messages → **FYI** (should read)
- Healthcare appointment reminders → **FYI**
- Order confirmations → **archive** (unless there's a problem)
- Data leak alerts → **ACTION** (need to change passwords)
- Tax documents → **FYI** (need to reference, not act immediately)
- Failed deployments → **FYI** (should know, but rarely urgent)
- Subscription renewal reminders → **FYI** (so you can cancel if unwanted)

## Archiving

Goal: hit inbox zero most days.

- If not labeled ACTION or FYI → archive (remove from inbox)
- ACTION and FYI items stay in inbox until you handle them
- When you archive a thread → that means you've handled it; remove ACTION/FYI labels (the skill does this for you on the next triage)

## Unsubscribing

The agent can compile a periodic list of senders worth unsubscribing from. Workflow:

- Once a month, agent compiles a list of frequent low-value senders
- You review and confirm which to unsubscribe from
- Agent visits unsubscribe links (via a browser automation tool) and confirms each
- If a sender keeps emailing 5+ days after unsubscribe → mark as spam

Keep a running log here of completed unsubscribes, so the agent doesn't re-suggest senders you've already dealt with.

## Training notes

Use this section to teach the agent the patterns specific to your inbox that aren't obvious from sender rules. Examples to inspire your own:

- "I get push notifications for delivery updates — email is redundant, archive immediately"
- "Magic links and OTP codes → FYI, not ACTION — just need them surfaced"
- "Healthcare care team messages are People, not Money — treat care team like real people"
- "Distinguish newsletters I value from SaaS marketing"
- "Notifications from <specific frequent sender> are high volume — archive unless flagged"

Add a new line every time you correct the agent's behavior. Over time, this section captures your taste.
