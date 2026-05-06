# RAELIX — Jarvis-Style Personal AI Operating System (MVP)

RAELIX is a modular personal AI operating system built for local development with production-minded architecture.

It ships with:
- React + Vite + Tailwind futuristic dashboard
- Node.js + Express + TypeScript API
- Brain Orchestrator with specialist agent routing
- Modular agent and tool registries
- SQLite memory system for persistent state
- Voice controls (Web Speech API in frontend)
- Placeholders for OpenAI, Gemini, Claude, Ollama, Gmail, Twilio, smart-home integrations, and printer workflows

---

## Project Structure

```txt
raelix-jarvis/
  apps/
    web/
    api/
  packages/
    agents/
    tools/
    memory/
    shared/
  data/
    projects/
  docs/
  .env.example
  README.md
```

---

## Installation

From repository root:

```bash
cd raelix-jarvis
npm install
```

---

## Environment Setup

Create a local `.env` file:

```bash
cp .env.example .env
```

Placeholders included (safe to leave empty for MVP):

```env
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434

GMAIL_CLIENT_ID=
GMAIL_CLIENT_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

API_PORT=4000
WEB_PORT=5173
RAELIX_DEFAULT_ROLE=admin
RAELIX_DB_PATH=./data/raelix.db
RAELIX_PROJECTS_DIR=./data/projects
```

> Keys remain backend-only and are never sent to the frontend.

---

## Run the App

### Run both API + Web together
```bash
npm run dev
```

### Or run separately
```bash
npm run dev:api
npm run dev:web
```

- API: `http://localhost:4000/api/health`
- Web: `http://localhost:5173`

---

## MVP Test Flow (What to test first)

1. Open dashboard in browser.
2. Send: `Tell Taylor a bedtime story`
   - Brain should route to **Family / Kids Agent**.
   - Response should include bedtime story output.
3. Send: `Turn on living room lights`
   - Brain should route to **Smart Home Agent**.
   - Tool log should show mock smart-home success.
4. Send: `Create a roofing estimate reminder for tomorrow`
   - Brain should route to **Task Agent**.
   - Task should appear in Task Panel.
5. Open conversation history and tool logs to verify persistence.

---

## How the Brain Works

`apps/api/src/brain/orchestrator.ts`

- Receives user input from `/api/chat`.
- Detects intent via keyword-based decision matrix (or honors manual agent selection).
- Enforces child-role guardrails by routing through Family/Kids profile.
- Runs selected agent.
- Stores user + assistant messages.
- Persists memory hints and tool logs.

---

## How Agents Work

`packages/agents/src/index.ts`

Each agent includes:
- `name`
- `description`
- `allowedTools`
- `sampleBehavior`
- async `run(input, context)`

Current agents:
- General Assistant Agent
- Coding Agent
- Business Strategy Agent
- Smart Home Agent
- Email Agent
- Calendar Agent
- Task Agent
- Family / Kids Agent
- Bible / Faith Agent
- Research Agent
- File Manager Agent
- Printer Agent
- Security Agent

---

## How Tools Work

`packages/tools/src/index.ts`

Tool registry maps tool names to handlers. Current mock tools:
- send_email
- read_email
- send_text
- make_phone_call
- create_calendar_event
- create_task
- turn_on_light
- dim_light
- turn_off_all_lights
- print_document
- search_web
- create_file
- read_file
- generate_code
- tell_bedtime_story
- bible_verse_lookup

Tools can later be swapped from mock logic to real service adapters with minimal API changes.

---

## How to Add a New Agent

1. Open `packages/agents/src/index.ts`
2. Add a new agent object in `baseAgents(runtime)` with required fields.
3. Assign `allowedTools` and implement `run()`.
4. Add Brain routing keywords in `apps/api/src/brain/orchestrator.ts` decision matrix (optional but recommended).

---

## How to Add a New Tool

1. Open `packages/shared/src/index.ts` and add tool name to `ToolName` union.
2. Open `packages/tools/src/index.ts` and add handler to `toolRegistry`.
3. Add tool to desired agents in `packages/agents/src/index.ts`.
4. Verify tool logs in dashboard after chat execution.

---

## Security Notes

- API keys live in `.env`, never in frontend.
- Role-ready structure included: `admin`, `family`, `child`, `guest`.
- Request context middleware accepts role/mode headers and can be extended for real auth.

---

## Data Storage

SQLite file default: `./data/raelix.db`

Tables:
- users
- conversations
- messages
- memories
- tasks
- agents
- tool_logs

Designed so memory layer can later be replaced with PostgreSQL/Supabase adapter.
