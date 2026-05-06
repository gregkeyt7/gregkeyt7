import { FormEvent } from "react";
import { Panel } from "../components/Panel";
import { ConversationHistory } from "../components/ConversationHistory";
import type { BootstrapPayload, ChatMessage, LiveSession, MemoryItem, TaskItem, ToolLog, WakeWordSettings } from "../lib/types";

interface DashboardPageProps {
  bootstrap: BootstrapPayload | null;
  messages: ChatMessage[];
  chatInput: string;
  selectedAgent: string | undefined;
  mode: string;
  loading: boolean;
  tasks: TaskItem[];
  memories: MemoryItem[];
  toolLogs: ToolLog[];
  conversations: Array<{ id: number; title: string; updated_at: string }>;
  conversationId?: number;
  isListening: boolean;
  voiceSupported: boolean;
  liveSession: LiveSession | null;
  wakeWordSettings: WakeWordSettings | null;
  onChatInputChange: (value: string) => void;
  onSelectedAgentChange: (value: string | undefined) => void;
  onSend: (event: FormEvent) => void;
  onSpeak: () => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onConversationSelect: (conversationId: number) => void;
  onStartLiveSession: (type: LiveSession["session_type"]) => void;
  onStopLiveSession: () => void;
}

export const DashboardPage = ({
  bootstrap,
  messages,
  chatInput,
  selectedAgent,
  mode,
  loading,
  tasks,
  memories,
  toolLogs,
  conversations,
  conversationId,
  isListening,
  voiceSupported,
  liveSession,
  wakeWordSettings,
  onChatInputChange,
  onSelectedAgentChange,
  onSend,
  onSpeak,
  onStartListening,
  onStopListening,
  onConversationSelect,
  onStartLiveSession,
  onStopLiveSession,
}: DashboardPageProps) => {
  const advancedAgentCards = [
    "Education Agent",
    "Trading Agent",
    "Tax Lien / Tax Deed Agent",
    "Cooking / Live Guidance Agent",
  ];

  return (
    <main className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-4">
        <Panel title="Chat Core" subtitle="Brain Orchestrator receives and routes every request">
          <div className="mb-3 flex flex-wrap gap-2">
            <select
              className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
              value={selectedAgent}
              onChange={(event) => onSelectedAgentChange(event.target.value)}
            >
              <option value="">Auto-route via Brain</option>
              {bootstrap?.agents.map((agent) => (
                <option key={agent.id} value={agent.name}>
                  {agent.name}
                </option>
              ))}
            </select>
            <button
              className="rounded-xl border border-neon/30 bg-neon/10 px-3 py-2 text-xs text-neon"
              type="button"
              onClick={() => onSelectedAgentChange(undefined)}
            >
              Auto-route via Brain
            </button>
            <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs">
              Mode: <span className="text-neon">{mode}</span>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs">
              Conversation: <span className="text-neon">{conversationId ?? "new"}</span>
            </div>
          </div>

          <div className="h-72 space-y-3 overflow-auto rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-slate-400">
                Try: "Tell Taylor a bedtime story", "Turn on living room lights", "Build a trading strategy", or "Go live cooking mode".
              </p>
            ) : null}
            {messages.map((message) => (
              <article
                key={message.id}
                className={`rounded-xl border p-3 ${
                  message.role === "user"
                    ? "border-slate-700 bg-slate-900 text-slate-100"
                    : "border-neon/40 bg-slate-900/70 text-slate-100"
                }`}
              >
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {message.role}
                  {message.agentName ? ` · ${message.agentName}` : ""}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
              </article>
            ))}
          </div>

          <form className="mt-3 flex flex-col gap-2" onSubmit={onSend}>
            <textarea
              className="min-h-24 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none ring-neon/40 transition focus:ring"
              placeholder="Send a command to RAELIX..."
              value={chatInput}
              onChange={(event) => onChatInputChange(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-xl bg-glow px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={loading}
                type="submit"
              >
                {loading ? "Thinking..." : "Send Command"}
              </button>
              <button className="rounded-xl border border-slate-700 px-4 py-2 text-sm" type="button" onClick={onSpeak}>
                Speak Response
              </button>
              <button
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:opacity-60"
                type="button"
                disabled={!voiceSupported}
                onClick={onStartListening}
              >
                Start Listening
              </button>
              <button
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:opacity-60"
                type="button"
                disabled={!voiceSupported}
                onClick={onStopListening}
              >
                Stop Listening
              </button>
              <div className="rounded-xl border border-slate-700 px-3 py-2 text-xs text-slate-300">
                Voice: {voiceSupported ? (isListening ? "Listening" : "Ready") : "Unavailable"}
              </div>
            </div>
          </form>
        </Panel>

        <Panel title="Advanced Specialist Agents" subtitle="Quick select cards for Education, Trading, Tax Lien/Deed, and Cooking">
          <div className="grid gap-2 sm:grid-cols-2">
            {advancedAgentCards.map((agentName) => (
              <button
                key={agentName}
                className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-left text-sm hover:border-neon/50"
                onClick={() => onSelectedAgentChange(agentName)}
                type="button"
              >
                {agentName}
              </button>
            ))}
          </div>
        </Panel>

        <Panel title="Smart Home" subtitle="Alexa, Google Home, Home Assistant, and Matter adapters are scaffolded">
          <div className="grid gap-2 sm:grid-cols-3">
            {["Turn on living room lights", "Dim bedroom lights to 40%", "Turn off all lights"].map((command) => (
              <button
                key={command}
                className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-left text-sm hover:border-neon/50"
                onClick={() => onChatInputChange(command)}
                type="button"
              >
                {command}
              </button>
            ))}
          </div>
        </Panel>
      </div>

      <div className="space-y-4">
        <Panel title="Live Mode" subtitle="Continuous session guidance until you stop it">
          <div className="space-y-2 text-sm">
            <p>
              Status: <span className="text-neon">{liveSession ? "Active" : "Inactive"}</span>
            </p>
            <p>Session Type: {liveSession?.session_type ?? "None"}</p>
            <p>Current Step: {liveSession?.current_step ?? "-"}</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
                type="button"
                onClick={() => onStartLiveSession("cooking")}
              >
                Start Cooking Mode
              </button>
              <button
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs"
                type="button"
                onClick={() => onStartLiveSession("education")}
              >
                Start Learning Mode
              </button>
              <button
                className="rounded-xl border border-rose-500/60 bg-rose-900/20 px-3 py-2 text-xs"
                type="button"
                onClick={onStopLiveSession}
              >
                Stop Live Mode
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Wake Word Settings" subtitle="Placeholder wake-word configuration">
          <div className="space-y-2 text-xs text-slate-300">
            <p>Primary: {wakeWordSettings?.primaryWakePhrase ?? "Hey Ray"}</p>
            <p>Secondary: {wakeWordSettings?.secondaryWakePhrase ?? "Mr. Ray"}</p>
            <p>Assistant Full Name: {wakeWordSettings?.assistantFullName ?? "RAELIX"}</p>
            <p>Short Name: {wakeWordSettings?.shortName ?? "Ray"}</p>
            <p className="text-slate-500">Voice input recognizes activation phrase prefixes and strips them from commands.</p>
          </div>
        </Panel>

        <Panel title="Task Panel" subtitle="Persistent SQLite-backed reminders from Task Agent">
          <div className="max-h-44 space-y-2 overflow-auto">
            {tasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-sm">
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-slate-400">Due: {task.due_date ? new Date(task.due_date).toLocaleString() : "Not set"}</p>
              </div>
            ))}
            {tasks.length === 0 ? <p className="text-sm text-slate-400">No tasks yet.</p> : null}
          </div>
        </Panel>

        <Panel title="Memory Panel" subtitle="User preferences, family notes, and business context">
          <div className="max-h-44 space-y-2 overflow-auto">
            {memories.map((memory) => (
              <div key={memory.id} className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-sm">
                <p className="font-medium">{memory.key}</p>
                <p className="text-xs text-slate-300">{memory.value}</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">{memory.category}</p>
              </div>
            ))}
            {memories.length === 0 ? <p className="text-sm text-slate-400">No memories captured yet.</p> : null}
          </div>
        </Panel>

        <Panel title="Tool Activity Log" subtitle="Every tool call is recorded for auditability">
          <div className="max-h-52 space-y-2 overflow-auto">
            {toolLogs.map((log) => (
              <div key={log.id} className="rounded-xl border border-slate-700 bg-slate-900 p-2 text-sm">
                <p className="font-medium text-neon">{log.tool_name}</p>
                <p className="text-xs text-slate-300">{log.output}</p>
                <p className="text-[11px] text-slate-500">{log.agent_name}</p>
              </div>
            ))}
            {toolLogs.length === 0 ? <p className="text-sm text-slate-400">No tool activity yet.</p> : null}
          </div>
        </Panel>

        <ConversationHistory
          conversations={conversations}
          activeConversationId={conversationId}
          onSelect={onConversationSelect}
        />
      </div>
    </main>
  );
};
