import type {
  BootstrapPayload,
  ChatResponse,
  ConversationItem,
  LiveSession,
  MemoryItem,
  StoredMessage,
  TaskItem,
  ToolLog,
} from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api";

export const fetchBootstrap = async (headers: Record<string, string>): Promise<BootstrapPayload> => {
  const response = await fetch(`${API_BASE}/bootstrap`, { headers });
  if (!response.ok) {
    throw new Error("Failed to load bootstrap data");
  }
  return response.json() as Promise<BootstrapPayload>;
};

export const sendChat = async (
  payload: {
    input: string;
    selectedAgent?: string;
    conversationId?: number;
  },
  headers: Record<string, string>,
): Promise<ChatResponse> => {
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Chat request failed");
  }

  return response.json() as Promise<ChatResponse>;
};

export const fetchLiveSession = async (headers: Record<string, string>): Promise<LiveSession | null> => {
  const response = await fetch(`${API_BASE}/live-session`, { headers });
  if (!response.ok) {
    throw new Error("Failed to load live session state");
  }

  const payload = (await response.json()) as { activeLiveSession: LiveSession | null };
  return payload.activeLiveSession;
};

export const startLiveSession = async (
  sessionType: LiveSession["session_type"],
  headers: Record<string, string>,
): Promise<LiveSession> => {
  const response = await fetch(`${API_BASE}/live-session/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify({ sessionType }),
  });

  if (!response.ok) {
    throw new Error("Failed to start live session");
  }

  const payload = (await response.json()) as { activeLiveSession: LiveSession };
  return payload.activeLiveSession;
};

export const stopLiveSession = async (headers: Record<string, string>): Promise<LiveSession | null> => {
  const response = await fetch(`${API_BASE}/live-session/stop`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to stop live session");
  }

  const payload = (await response.json()) as { activeLiveSession: LiveSession | null };
  return payload.activeLiveSession;
};

export const fetchTasks = async (headers: Record<string, string>): Promise<TaskItem[]> => {
  const response = await fetch(`${API_BASE}/tasks`, { headers });
  if (!response.ok) {
    throw new Error("Failed to load tasks");
  }
  return response.json() as Promise<TaskItem[]>;
};

export const fetchConversations = async (headers: Record<string, string>): Promise<ConversationItem[]> => {
  const response = await fetch(`${API_BASE}/conversations`, { headers });
  if (!response.ok) {
    throw new Error("Failed to load conversations");
  }
  return response.json() as Promise<ConversationItem[]>;
};

export const fetchConversationMessages = async (
  conversationId: number,
  headers: Record<string, string>,
): Promise<StoredMessage[]> => {
  const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, { headers });
  if (!response.ok) {
    throw new Error("Failed to load conversation messages");
  }
  return response.json() as Promise<StoredMessage[]>;
};

export const fetchMemories = async (headers: Record<string, string>): Promise<MemoryItem[]> => {
  const response = await fetch(`${API_BASE}/memories`, { headers });
  if (!response.ok) {
    throw new Error("Failed to load memories");
  }
  return response.json() as Promise<MemoryItem[]>;
};

export const fetchToolLogs = async (headers: Record<string, string>): Promise<ToolLog[]> => {
  const response = await fetch(`${API_BASE}/tool-logs`, { headers });
  if (!response.ok) {
    throw new Error("Failed to load tool logs");
  }
  return response.json() as Promise<ToolLog[]>;
};
