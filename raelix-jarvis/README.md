# RAELIX — Jarvis-Style Personal AI Operating System (MVP+)

RAELIX is a modular personal AI operating system built for local development with production-minded architecture.

It ships with:
- React + Vite + Tailwind futuristic dashboard
- Node.js + Express + TypeScript API
- Brain Orchestrator with specialist agent routing
- Modular agent and tool registries
- SQLite memory system for persistent state
- Live Session Mode (step-by-step continuous guidance)
- Wake-word placeholder model (`Hey Ray`, `Mr. Ray`)
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

```bash
cd raelix-jarvis
npm install
```

---

## Environment Setup

```bash
cp .env.example .env
```

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

Optional frontend override:

```env
VITE_API_BASE_URL=http://localhost:4000/api
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

## New Advanced Agents

### Education Agent
- Teaches topics from beginner to expert
- Can create quizzes, flashcards, study plans, and lesson plans
- Uses Step 1-only default for hard topics unless user asks to continue

### Trading Agent
- Strategy analysis, backtesting plans, journal entries, Pine Script templates, risk sizing
- **Safety rules enforced**:
  - no guaranteed profit claims
  - no "hardly ever lose" claims
  - no live trade execution
  - defaults to risk management + paper/backtest-first workflow

### Tax Lien / Tax Deed Agent
- Tax lien vs deed explanation
- County checklist and due diligence support
- Property/auction note tracking placeholders

### Cooking / Live Guidance Agent
- Step-by-step cooking guidance
- Timer suggestions, recipe steps, substitutions, meal planning context
- Supports live kitchen mode

---

## Live Session Mode

Supported session types:
- `cooking`
- `education`
- `workout`
- `coding`
- `project`

Behavior:
- RAELIX can keep guiding step-by-step while a live session is active
- Step counter advances as guidance continues
- Stop phrases supported:
  - `quit`
  - `stop live mode`
  - `end session`
  - `that's enough Ray` / `that’s enough Ray`
  - `cancel live mode`

API endpoints:
- `GET /api/live-session`
- `POST /api/live-session/start`
- `POST /api/live-session/stop`

---

## Wake Word Placeholder Design

Current placeholder settings:
- Primary: `Hey Ray`
- Secondary: `Mr. Ray`
- Full assistant name: `RAELIX`
- Short name: `Ray`

Frontend voice flow strips activation phrase prefixes before sending commands.

### Adding Home Assistant wake-word integration later
- Keep wake-word detection local/edge for privacy and latency
- Forward only post-activation command text to API
- Add confidence threshold and fallback to manual push-to-talk
- Keep user-configurable phrase profiles in secure settings storage

---

## Memory & Storage

SQLite tables include:
- `users`
- `conversations`
- `messages`
- `memories`
- `tasks`
- `agents`
- `tool_logs`
- `learning_profiles`
- `study_sessions`
- `trade_journal`
- `watched_assets`
- `tax_lien_properties`
- `live_sessions`
- `recipes`

Designed so memory layer can later be replaced with PostgreSQL/Supabase adapter.

---

## How the Brain Works

`apps/api/src/brain/orchestrator.ts`

- Receives input from `/api/chat`
- Detects explicit live-session stop commands
- Starts live sessions when requested
- Routes by active live session type when live mode is active
- Otherwise routes by intent keyword matrix
- Applies child-role safety override
- Runs selected agent + tool chain
- Persists conversation, memory hints, and tool logs

---

## How Agents Work

`packages/agents/src/index.ts`

Each agent includes:
- `name`
- `description`
- `allowedTools`
- `sampleBehavior`
- async `run(input, context)`

Add a new agent by:
1. Extending `AgentName` in `packages/shared/src/index.ts`
2. Adding the agent definition in `packages/agents/src/index.ts`
3. Adding routing keywords in `apps/api/src/brain/orchestrator.ts`

---

## How Tools Work

`packages/tools/src/index.ts`

Registry includes communication, tasking, smart-home placeholders, coding/file tools, education/trading/tax/cooking helpers, and live-session controls.

Add a new tool by:
1. Extending `ToolName` in `packages/shared/src/index.ts`
2. Adding handler in `packages/tools/src/index.ts`
3. Wiring it into allowed tools for relevant agents

---

## Broker API Integration Later (Trading)

When adding real broker execution:
- require explicit confirmation layers (2-step or signed intent)
- separate simulation endpoints from execution endpoints
- enforce server-side risk limits and max position caps
- keep audit logging for every action
- start with paper environment only before enabling live keys

---

## Security Notes

- API keys live in `.env`, never in frontend.
- Role-ready structure included: `admin`, `family`, `child`, `guest`.
- Request context middleware accepts role/mode headers and can be extended for real auth.
