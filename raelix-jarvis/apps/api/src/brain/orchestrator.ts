import { createAgentRegistry, listAgents } from "@raelix/agents";
import type { AgentDefinition, AgentName, BrainDecision, Mode, UserRole } from "@raelix/shared";
import type { MemoryStore } from "@raelix/memory";

const decisionMatrix: Array<{ keywords: string[]; agent: AgentName; reason: string }> = [
  {
    keywords: ["bedtime", "story", "kids", "child", "taylor"],
    agent: "Family / Kids Agent",
    reason: "Detected family or bedtime storytelling intent.",
  },
  {
    keywords: ["light", "smart home", "dim", "living room", "bedroom"],
    agent: "Smart Home Agent",
    reason: "Detected smart home control intent.",
  },
  {
    keywords: ["task", "reminder", "todo", "follow up"],
    agent: "Task Agent",
    reason: "Detected task management intent.",
  },
  {
    keywords: ["email", "gmail", "send mail", "inbox"],
    agent: "Email Agent",
    reason: "Detected email workflow intent.",
  },
  {
    keywords: ["calendar", "schedule", "appointment", "meeting"],
    agent: "Calendar Agent",
    reason: "Detected calendar intent.",
  },
  {
    keywords: ["code", "website", "app", "cursor", "build"],
    agent: "Coding Agent",
    reason: "Detected software development intent.",
  },
  {
    keywords: ["business", "strategy", "pricing", "market"],
    agent: "Business Strategy Agent",
    reason: "Detected business strategy intent.",
  },
  {
    keywords: ["bible", "faith", "verse", "pray"],
    agent: "Bible / Faith Agent",
    reason: "Detected faith guidance intent.",
  },
  {
    keywords: ["research", "analyze", "investigate"],
    agent: "Research Agent",
    reason: "Detected research intent.",
  },
  {
    keywords: ["file", "folder", "save"],
    agent: "File Manager Agent",
    reason: "Detected file management intent.",
  },
  {
    keywords: ["print", "printer", "pdf"],
    agent: "Printer Agent",
    reason: "Detected printing intent.",
  },
  {
    keywords: ["security", "safe", "role", "permission"],
    agent: "Security Agent",
    reason: "Detected security and access-control intent.",
  },
];

const detectIntent = (input: string): BrainDecision => {
  const lower = input.toLowerCase();
  const match = decisionMatrix.find((entry) => entry.keywords.some((keyword) => lower.includes(keyword)));

  if (match) {
    return {
      selectedAgent: match.agent,
      reason: match.reason,
    };
  }

  return {
    selectedAgent: "General Assistant Agent",
    reason: "No specialist keyword detected, using general assistant fallback.",
  };
};

const rememberImportantFacts = async (memory: MemoryStore, userId: number, input: string): Promise<void> => {
  const lower = input.toLowerCase();
  const nameMatch = input.match(/my name is ([a-zA-Z]+)/i);
  if (nameMatch) {
    await memory.addMemory(userId, "preferred_name", nameMatch[1], "profile");
  }

  if (lower.includes("my daughter") || lower.includes("my son") || lower.includes("family")) {
    await memory.addMemory(userId, "family_note", input, "family");
  }

  if (lower.includes("business") || lower.includes("project")) {
    await memory.addMemory(userId, "project_note", input, "business");
  }
};

export class BrainOrchestrator {
  private readonly registry: ReturnType<typeof createAgentRegistry>;

  constructor(
    private readonly memory: MemoryStore,
    private readonly projectsDir: string,
  ) {
    this.registry = createAgentRegistry({
      tools: {
        userId: 1,
        projectsDir,
        createTask: async (title, dueDate) => {
          const task = await this.memory.createTask(1, title, dueDate);
          return { id: task.id, title: task.title };
        },
      },
    });
  }

  async initialize(): Promise<void> {
    await this.memory.initialize(
      listAgents({
        tools: {
          userId: 1,
          projectsDir: this.projectsDir,
          createTask: async (title, dueDate) => ({ id: 0, title: `${title}-${dueDate ?? "none"}` }),
        },
      }).map((agent) => ({ name: agent.name, description: agent.description })),
    );
  }

  getAgentCatalog(): AgentDefinition[] {
    return Object.values(this.registry);
  }

  async handleMessage(params: {
    input: string;
    userId: number;
    role: UserRole;
    mode: Mode;
    selectedAgent?: AgentName;
    conversationId?: number;
  }): Promise<{
    conversationId: number;
    selectedAgent: AgentName;
    reason: string;
    response: string;
    toolResults: Array<{ tool: string; ok: boolean; summary: string }>;
  }> {
    const requestedDecision = params.selectedAgent
      ? {
          selectedAgent: params.selectedAgent,
          reason: "Agent explicitly selected by user.",
        }
      : detectIntent(params.input);

    const decision =
      params.role === "child" && requestedDecision.selectedAgent !== "Family / Kids Agent"
        ? {
            selectedAgent: "Family / Kids Agent" as AgentName,
            reason: "Child role active, routing through Family / Kids Agent safety profile.",
          }
        : requestedDecision;

    const conversationId = params.conversationId ?? (await this.memory.createConversation(params.userId, params.input.slice(0, 80)));
    await this.memory.addMessage(conversationId, "user", params.input);
    await rememberImportantFacts(this.memory, params.userId, params.input);

    const runtimeRegistry = createAgentRegistry({
      tools: {
        userId: params.userId,
        projectsDir: this.projectsDir,
        createTask: async (title, dueDate) => {
          const task = await this.memory.createTask(params.userId, title, dueDate);
          return { id: task.id, title: task.title };
        },
      },
    });

    const agent = runtimeRegistry[decision.selectedAgent];
    const result = await agent.run(params.input, {
      userId: params.userId,
      mode: params.mode,
      role: params.role,
      conversationId,
    });

    await this.memory.addMessage(conversationId, "assistant", result.response, result.agent);

    for (const toolResult of result.toolResults) {
      await this.memory.logToolCall({
        userId: params.userId,
        agentName: result.agent,
        toolName: toolResult.tool,
        status: toolResult.ok ? "success" : "failure",
        input: params.input,
        output: toolResult.summary,
      });
    }

    return {
      conversationId,
      selectedAgent: result.agent,
      reason: decision.reason,
      response: result.response,
      toolResults: result.toolResults.map((item) => ({
        tool: item.tool,
        ok: item.ok,
        summary: item.summary,
      })),
    };
  }
}
