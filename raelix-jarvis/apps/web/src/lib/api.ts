import type { BootstrapPayload, ChatResponse } from "./types";

const API_BASE = "http://localhost:4000/api";

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

export const fetchTasks = async (headers: Record<string, string>) => {
  const response = await fetch(`${API_BASE}/tasks`, { headers });
  return response.json();
};

export const fetchConversations = async (headers: Record<string, string>) => {
  const response = await fetch(`${API_BASE}/conversations`, { headers });
  return response.json();
};

export const fetchConversationMessages = async (conversationId: number, headers: Record<string, string>) => {
  const response = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, { headers });
  return response.json();
};

export const fetchMemories = async (headers: Record<string, string>) => {
  const response = await fetch(`${API_BASE}/memories`, { headers });
  return response.json();
};

export const fetchToolLogs = async (headers: Record<string, string>) => {
  const response = await fetch(`${API_BASE}/tool-logs`, { headers });
  return response.json();
};
