# Jarvis Lite Starter

This repository now contains a complete **Jarvis Lite** starter that is designed
to be free or near-free and focused on execution:

- n8n for workflow orchestration
- Ollama for local LLM inference
- Telegram for your command center
- Google Sheets for tracking leads, money, and credit actions

## Quick start

```bash
cd jarvis-lite
cp .env.example .env
./scripts/bootstrap.sh
```

Then follow `jarvis-lite/README.md` to:

1. Create your Telegram bot token
2. Add Google Sheets credentials in n8n
3. Import the four workflow JSON files
4. Launch your daily execution loop
