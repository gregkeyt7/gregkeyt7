# Jarvis Lite (Free/Near-Free)

Jarvis Lite is a practical personal operations stack for:

- daily execution and accountability
- income opportunity discovery and outreach
- cashflow tracking
- credit improvement habits

It runs on local tooling where possible and uses optional cloud APIs.

## 1) What gets installed

- `n8n` (workflow automation)
- `ollama` (local AI models)
- project folders for prompts, templates, logs, and workflows

## 2) Prerequisites

- Docker + Docker Compose
- Telegram account (for your command center)
- Google account (for Google Sheets tracking)

## 3) Bootstrap

```bash
cp .env.example .env
./scripts/bootstrap.sh
```

After startup:

- n8n: `http://localhost:5678`
- Ollama API: `http://localhost:11434`

## 4) Configure credentials in n8n

1. Create an n8n owner account in the browser.
2. Add credentials:
   - Telegram API
   - Google Sheets (OAuth2 or service account)
   - Optional: OpenAI or Gemini API key (if you want cloud model fallback)

## 5) Telegram setup

1. Talk to `@BotFather`, create a bot, and copy the token.
2. Put the token into `.env` as `TELEGRAM_BOT_TOKEN`.
3. Message your bot once so the chat can be discovered.
4. In n8n, run the helper flow or use Telegram Trigger to capture your chat ID.
5. Put chat ID in `.env` as `TELEGRAM_CHAT_ID`.

## 6) Import workflows

Import all JSON files in `workflows/` into n8n:

- `daily-briefing.json`
- `opportunity-hunter.json`
- `outreach-factory.json`
- `credit-guardrail.json`

Each workflow includes `TODO` notes where you must map your own credentials,
sheet IDs, and preferred model endpoint.

## 7) Google Sheet tabs

Create one spreadsheet with these tabs:

- `Daily_Score`
- `Leads`
- `Cashflow`
- `Credit_Tracker`
- `Wins`

Column definitions are in `templates/google-sheets-schema.md`.

## 8) Prompt files

Agent prompts live in `prompts/`:

- Commander
- Money
- Credit
- Opportunity
- Outreach

These can be pasted into:

- n8n AI nodes
- ChatGPT/Gemini custom instructions
- your local model prompt wrappers

## 9) First-day launch checklist

1. Pick one offer from `templates/offer-menu.md`.
2. Build your lead list (20 contacts).
3. Use `templates/outreach-first-20.md` to send your first campaign.
4. Run the Daily Briefing workflow tomorrow morning.
5. Log outcomes in `Daily_Score` and `Leads`.

## 10) Health check

```bash
./scripts/check_setup.sh
```

This checks that:

- Docker is available
- n8n container is running
- ollama container is running
- workflow files exist and parse as valid JSON
