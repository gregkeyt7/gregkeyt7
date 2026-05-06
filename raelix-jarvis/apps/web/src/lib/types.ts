export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  allowedTools: string[];
  sampleBehavior: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentName?: string;
}

export interface TaskItem {
  id: number;
  title: string;
  due_date: string | null;
  status: "open" | "completed";
  created_at: string;
}

export interface MemoryItem {
  id: number;
  key: string;
  value: string;
  category: string;
  created_at: string;
}

export interface ToolLog {
  id: number;
  agent_name: string;
  tool_name: string;
  status: "success" | "failure";
  output: string;
  created_at: string;
}

export interface BootstrapPayload {
  user: { id: number; name: string; role: string };
  agents: AgentDefinition[];
  tasks: TaskItem[];
  memories: MemoryItem[];
  toolLogs: ToolLog[];
  conversations: Array<{ id: number; title: string; updated_at: string }>;
  providers: Array<{ name: string; available: boolean; reason: string }>;
  communication: {
    gmailReady: boolean;
    twilioReady: boolean;
  };
  voice: {
    webSpeechApi: "frontend-managed";
    whisperReady: boolean;
    elevenLabsReady: boolean;
    openAiTtsReady: boolean;
  };
  availableRoles: string[];
  availableModes: string[];
}

export interface StoredMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent_name: string | null;
  created_at: string;
}

export interface ChatResponse {
  conversationId: number;
  selectedAgent: string;
  reason: string;
  response: string;
  toolResults: Array<{ tool: string; ok: boolean; summary: string }>;
}

export interface ConversationMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent_name: string | null;
}
