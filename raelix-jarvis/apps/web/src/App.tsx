import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { fetchBootstrap, fetchConversationMessages, fetchConversations, fetchMemories, fetchTasks, fetchToolLogs, sendChat } from "./lib/api";
import type { BootstrapPayload, ChatMessage, ConversationItem, MemoryItem, TaskItem, ToolLog } from "./lib/types";
import { useVoiceControls } from "./hooks/useVoiceControls";
import { DashboardPage } from "./pages/DashboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ApiKeysPage } from "./pages/ApiKeysPage";

function App() {
  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>(undefined);
  const [conversationId, setConversationId] = useState<number | undefined>();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeView, setActiveView] = useState<"dashboard" | "settings" | "api">("dashboard");
  const [mode, setMode] = useState("family");
  const [role, setRole] = useState("admin");
  const [userName, setUserName] = useState("Owner");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [toolLogs, setToolLogs] = useState<ToolLog[]>([]);
  const [loading, setLoading] = useState(false);

  const headers = useMemo(
    () => ({
      "x-raelix-user": userName,
      "x-raelix-role": role,
      "x-raelix-mode": mode,
    }),
    [mode, role, userName],
  );

  const loadBootstrap = useCallback(async () => {
    const data = await fetchBootstrap(headers);
    setBootstrap(data);
    setTasks(data.tasks);
    setMemories(data.memories);
    setToolLogs(data.toolLogs);
    setSelectedAgent((current) => current ?? data.agents[0]?.name);
    const conversationList = await fetchConversations(headers);
    setConversations(conversationList);
  }, [headers]);

  useEffect(() => {
    loadBootstrap().catch((error) => {
      // eslint-disable-next-line no-console
      console.error("Failed to load bootstrap", error);
    });
  }, [loadBootstrap]);

  const refreshPanels = useCallback(async () => {
    const [nextTasks, nextMemories, nextLogs, nextConversations] = await Promise.all([
      fetchTasks(headers),
      fetchMemories(headers),
      fetchToolLogs(headers),
      fetchConversations(headers),
    ]);

    setTasks(nextTasks);
    setMemories(nextMemories);
    setToolLogs(nextLogs);
    setConversations(nextConversations);
  }, [headers]);

  const selectConversation = useCallback(
    async (targetConversationId: number) => {
      setConversationId(targetConversationId);
      const history = await fetchConversationMessages(targetConversationId, headers);
      setMessages(
        history
          .filter((entry) => entry.role === "user" || entry.role === "assistant")
          .map((entry) => ({
            id: `${entry.id}`,
            role: entry.role,
            content: entry.content,
            agentName: entry.agent_name ?? undefined,
          })),
      );
    },
    [headers],
  );

  const handleSend = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const input = chatInput.trim();
      if (!input) {
        return;
      }

      setLoading(true);
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: input }]);
      setChatInput("");

      try {
        const result = await sendChat(
          {
            input,
            selectedAgent,
            conversationId,
          },
          headers,
        );

        setConversationId(result.conversationId);
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `${result.response}\n\n[Brain] ${result.reason}`,
            agentName: result.selectedAgent,
          },
        ]);

        await refreshPanels();
      } catch (error) {
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Request failed: ${(error as Error).message}`,
            agentName: "Security Agent",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [chatInput, conversationId, headers, refreshPanels, selectedAgent],
  );

  const { isListening, supported, startListening, stopListening, speak } = useVoiceControls((transcript) => {
    setChatInput(transcript);
  });

  return (
    <div className="min-h-screen px-4 pb-8 pt-6 text-slate-100 sm:px-6 lg:px-10">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Personal AI Operating System</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">RAELIX</h1>
          <p className="mt-1 text-sm text-slate-300">Jarvis-style modular assistant with memory, agents, and tools.</p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 p-1">
          {[
            ["dashboard", "Dashboard"],
            ["settings", "Settings"],
            ["api", "API Keys"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={`rounded-full px-4 py-2 text-sm ${activeView === value ? "bg-glow text-white" : "text-slate-300"}`}
              onClick={() => setActiveView(value as "dashboard" | "settings" | "api")}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {activeView === "dashboard" && (
        <DashboardPage
          bootstrap={bootstrap}
          messages={messages}
          chatInput={chatInput}
          selectedAgent={selectedAgent}
          mode={mode}
          loading={loading}
          tasks={tasks}
          memories={memories}
          toolLogs={toolLogs}
          conversations={conversations}
          conversationId={conversationId}
          isListening={isListening}
          voiceSupported={supported}
          onChatInputChange={setChatInput}
          onSelectedAgentChange={setSelectedAgent}
          onSend={handleSend}
          onSpeak={() => speak(messages.at(-1)?.content ?? "RAELIX is ready.")}
          onStartListening={startListening}
          onStopListening={stopListening}
          onConversationSelect={(targetId) => {
            selectConversation(targetId).catch((error) => {
              // eslint-disable-next-line no-console
              console.error("Failed to load conversation", error);
            });
          }}
        />
      )}

      {activeView === "settings" && (
        <SettingsPage
          bootstrap={bootstrap}
          mode={mode}
          role={role}
          userName={userName}
          onModeChange={setMode}
          onRoleChange={setRole}
          onUserNameChange={setUserName}
          onReload={() => {
            loadBootstrap().catch((error) => {
              // eslint-disable-next-line no-console
              console.error("Reload failed", error);
            });
          }}
        />
      )}

      {activeView === "api" && <ApiKeysPage />}
    </div>
  );
}

export default App;
