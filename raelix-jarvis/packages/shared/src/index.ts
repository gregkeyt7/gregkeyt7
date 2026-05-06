export type UserRole = "admin" | "family" | "child" | "guest";

export type Mode = "family" | "kids" | "business" | "developer";

export type AgentName =
  | "General Assistant Agent"
  | "Coding Agent"
  | "Business Strategy Agent"
  | "Smart Home Agent"
  | "Email Agent"
  | "Calendar Agent"
  | "Task Agent"
  | "Family / Kids Agent"
  | "Bible / Faith Agent"
  | "Research Agent"
  | "File Manager Agent"
  | "Printer Agent"
  | "Security Agent";

export type ToolName =
  | "send_email"
  | "read_email"
  | "send_text"
  | "make_phone_call"
  | "create_calendar_event"
  | "create_task"
  | "turn_on_light"
  | "dim_light"
  | "turn_off_all_lights"
  | "print_document"
  | "search_web"
  | "create_file"
  | "read_file"
  | "generate_code"
  | "tell_bedtime_story"
  | "bible_verse_lookup";

export interface AgentContext {
  userId: number;
  mode: Mode;
  role: UserRole;
  conversationId: number;
}

export interface ToolExecutionResult {
  tool: ToolName;
  ok: boolean;
  summary: string;
  payload?: Record<string, unknown>;
}

export interface AgentResult {
  agent: AgentName;
  response: string;
  toolResults: ToolExecutionResult[];
}

export interface AgentDefinition {
  id: string;
  name: AgentName;
  description: string;
  allowedTools: ToolName[];
  sampleBehavior: string;
  run: (input: string, context: AgentContext) => Promise<AgentResult>;
}

export interface BrainDecision {
  selectedAgent: AgentName;
  reason: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: "user" | "assistant" | "system";
  content: string;
  agent_name: string | null;
  created_at: string;
}

export interface TaskItem {
  id: number;
  user_id: number;
  title: string;
  due_date: string | null;
  status: "open" | "completed";
  created_at: string;
}

export interface MemoryItem {
  id: number;
  user_id: number;
  key: string;
  value: string;
  category: string;
  created_at: string;
}

export interface ToolLog {
  id: number;
  user_id: number;
  agent_name: string;
  tool_name: string;
  status: "success" | "failure";
  input: string;
  output: string;
  created_at: string;
}
