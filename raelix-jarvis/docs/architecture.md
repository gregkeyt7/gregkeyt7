# RAELIX Architecture Overview

## Core Principles
- **Modular AI OS** with strict separation: frontend, API, agents, tools, memory, and shared contracts.
- **Provider-ready design** so AI vendors can be wired later without re-architecting.
- **Local-first MVP** powered by SQLite and mock tools while preserving production migration paths.
- **Security-first defaults**: role-aware request context, secrets in `.env`, no key exposure in web app.

## Runtime Components

### 1) Brain Orchestrator (`apps/api/src/brain/orchestrator.ts`)
- Entry point for every message.
- Performs intent detection or respects explicit agent selection.
- Applies safety rule for child role (routes through Family / Kids Agent).
- Persists conversation messages, memory hints, and tool logs.

### 2) Agent Registry (`packages/agents/src/index.ts`)
- Defines 13 specialist agents with:
  - name
  - description
  - allowed tools
  - sample behavior
  - async `run(input, context)` logic
- Agents execute tools through `@raelix/tools` and return structured outputs.

### 3) Tool Registry (`packages/tools/src/index.ts`)
- Centralized mock tool handlers for:
  - communication (email/text/call)
  - smart home
  - calendar/tasks
  - files/code generation
  - printing
  - faith/kids/research helper actions
- Designed for future real provider adapters.

### 4) Memory System (`packages/memory/src/index.ts`)
SQLite tables:
- users
- conversations
- messages
- memories
- tasks
- agents
- tool_logs

Supports:
- profile memory
- family notes
- business notes
- persistent task storage
- conversation history
- tool call audit log

### 5) API Layer (`apps/api/src/routes/api.ts`)
- `/api/bootstrap` for dashboard hydration
- `/api/chat` for full Brain → Agent → Tool flow
- `/api/conversations`, `/api/conversations/:id/messages`
- `/api/tasks`, `/api/memories`, `/api/tool-logs`
- `/api/print/preview`

### 6) Web Dashboard (`apps/web/src`)
- Chat panel
- Agent selector
- voice controls (Web Speech API)
- task panel
- memory panel
- tool activity log
- conversation history
- settings (mode + role)
- API placeholder page

## Future Upgrade Path
- Swap SQLite store implementation with PostgreSQL/Supabase adapter behind memory interface.
- Replace mock AI providers with live SDK calls.
- Upgrade mock smart-home/email/text services to adapter integrations.
- Add auth provider in middleware and persisted sessions.
