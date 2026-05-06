import { createAgentRegistry, listAgents } from "@raelix/agents";
import type { AgentDefinition, AgentName, BrainDecision, LiveSession, LiveSessionType, Mode, UserRole } from "@raelix/shared";
import type { MemoryStore } from "@raelix/memory";

const decisionMatrix: Array<{ keywords: string[]; agent: AgentName; reason: string }> = [
  {
    keywords: ["teach", "explain", "study", "quiz", "lesson", "flashcard", "help my child learn"],
    agent: "Education Agent",
    reason: "Detected education and learning intent.",
  },
  {
    keywords: ["trade", "trading", "crypto", "forex", "pine", "backtest", "position size", "journal this trade"],
    agent: "Trading Agent",
    reason: "Detected trading research and strategy intent.",
  },
  {
    keywords: ["tax lien", "tax deed", "auction", "property bid", "county checklist", "redemption period"],
    agent: "Tax Lien / Tax Deed Agent",
    reason: "Detected tax lien / tax deed investing intent.",
  },
  {
    keywords: ["cook", "recipe", "dinner", "ingredients", "kitchen", "meal prep"],
    agent: "Cooking / Live Guidance Agent",
    reason: "Detected cooking and live guidance intent.",
  },
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

const stopLiveCommands = ["quit", "stop live mode", "end session", "that's enough ray", "that’s enough ray", "cancel live mode"];

const liveAgentByType: Record<LiveSessionType, AgentName> = {
  cooking: "Cooking / Live Guidance Agent",
  education: "Education Agent",
  workout: "General Assistant Agent",
  coding: "Coding Agent",
  project: "General Assistant Agent",
};

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

const detectLiveSessionStart = (input: string): LiveSessionType | null => {
  const lower = input.toLowerCase();
  if (lower.includes("start cooking mode") || lower.includes("go live cooking mode") || lower.includes("start kitchen mode")) {
    return "cooking";
  }
  if (lower.includes("start learning mode") || lower.includes("go live learning mode") || lower.includes("start education mode")) {
    return "education";
  }
  if (lower.includes("start coding mode") || lower.includes("go live coding mode")) {
    return "coding";
  }
  if (lower.includes("start workout mode")) {
    return "workout";
  }
  if (lower.includes("start project mode")) {
    return "project";
  }
  return null;
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
        createStudySession: async (subject, plan) => this.memory.createStudySession(1, subject, plan),
        createTradeJournalEntry: async (entry) => this.memory.createTradeJournalEntry(1, entry),
        createWatchedAsset: async (symbol, assetType, notes) => this.memory.createWatchedAsset(1, symbol, assetType, notes),
        createTaxLienProperty: async (propertyRef, county, notes) =>
          this.memory.createTaxLienProperty(1, propertyRef, county, notes),
        createRecipe: async (recipeName, steps) => this.memory.createRecipe(1, recipeName, steps),
        startLiveSession: async (sessionType, notes) => this.memory.startLiveSession(1, sessionType, notes),
        stopLiveSession: async (notes) => this.memory.stopLiveSession(1, notes),
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
          createStudySession: async () => 0,
          createTradeJournalEntry: async () => 0,
          createWatchedAsset: async () => 0,
          createTaxLienProperty: async () => 0,
          createRecipe: async () => 0,
          startLiveSession: async () => ({
            id: 0,
            user_id: 1,
            session_type: "project",
            status: "active",
            current_step: 1,
            notes: null,
            started_at: new Date().toISOString(),
            ended_at: null,
          }),
          stopLiveSession: async () => null,
        },
      }).map((agent) => ({ name: agent.name, description: agent.description })),
    );
  }

  getAgentCatalog(): AgentDefinition[] {
    return Object.values(this.registry);
  }

  isValidAgentName(agentName: string): agentName is AgentName {
    return Object.prototype.hasOwnProperty.call(this.registry, agentName);
  }

  async getActiveLiveSession(userId: number): Promise<LiveSession | null> {
    return this.memory.getActiveLiveSession(userId);
  }

  async stopLiveSession(userId: number): Promise<LiveSession | null> {
    return this.memory.stopLiveSession(userId, "Stopped from dashboard");
  }

  async startLiveSession(userId: number, sessionType: LiveSessionType, notes?: string): Promise<LiveSession> {
    return this.memory.startLiveSession(userId, sessionType, notes);
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
    activeLiveSession: LiveSession | null;
  }> {
    const lowerInput = params.input.toLowerCase();
    const conversationId =
      params.conversationId ?? (await this.memory.createConversation(params.userId, params.input.slice(0, 80)));

    await this.memory.addMessage(conversationId, "user", params.input);
    await rememberImportantFacts(this.memory, params.userId, params.input);

    const activeLiveSession = await this.memory.getActiveLiveSession(params.userId);
    if (activeLiveSession && stopLiveCommands.some((command) => lowerInput.includes(command))) {
      const stopped = await this.memory.stopLiveSession(params.userId, `Stopped by phrase: ${params.input}`);
      const response = "Live session ended. I will wait for your next request.";
      await this.memory.addMessage(conversationId, "assistant", response, "General Assistant Agent");
      return {
        conversationId,
        selectedAgent: "General Assistant Agent",
        reason: "Stop command received for active live session.",
        response,
        toolResults: [],
        activeLiveSession: stopped,
      };
    }

    let ensuredLiveSession = activeLiveSession;
    const startType = detectLiveSessionStart(params.input);
    if (!ensuredLiveSession && startType) {
      ensuredLiveSession = await this.memory.startLiveSession(params.userId, startType, params.input);
    }

    const explicitAgent =
      params.selectedAgent && this.isValidAgentName(params.selectedAgent) ? params.selectedAgent : undefined;

    const requestedDecision = explicitAgent
      ? {
          selectedAgent: explicitAgent,
          reason: "Agent explicitly selected by user.",
        }
      : ensuredLiveSession
        ? {
            selectedAgent: liveAgentByType[ensuredLiveSession.session_type],
            reason: `Active live session (${ensuredLiveSession.session_type}) is guiding routing.`,
          }
        : detectIntent(params.input);

    const decision =
      params.role === "child" && requestedDecision.selectedAgent !== "Family / Kids Agent"
        ? {
            selectedAgent: "Family / Kids Agent" as AgentName,
            reason: "Child role active, routing through Family / Kids Agent safety profile.",
          }
        : requestedDecision;

    const runtimeRegistry = createAgentRegistry({
      tools: {
        userId: params.userId,
        projectsDir: this.projectsDir,
        createTask: async (title, dueDate) => {
          const task = await this.memory.createTask(params.userId, title, dueDate);
          return { id: task.id, title: task.title };
        },
        createStudySession: async (subject, plan) => this.memory.createStudySession(params.userId, subject, plan),
        createTradeJournalEntry: async (entry) => this.memory.createTradeJournalEntry(params.userId, entry),
        createWatchedAsset: async (symbol, assetType, notes) =>
          this.memory.createWatchedAsset(params.userId, symbol, assetType, notes),
        createTaxLienProperty: async (propertyRef, county, notes) =>
          this.memory.createTaxLienProperty(params.userId, propertyRef, county, notes),
        createRecipe: async (recipeName, steps) => this.memory.createRecipe(params.userId, recipeName, steps),
        startLiveSession: async (sessionType, notes) => this.memory.startLiveSession(params.userId, sessionType, notes),
        stopLiveSession: async (notes) => this.memory.stopLiveSession(params.userId, notes),
      },
    });

    const agent = runtimeRegistry[decision.selectedAgent];
    const result = await agent.run(params.input, {
      userId: params.userId,
      mode: params.mode,
      role: params.role,
      conversationId,
      liveSession: ensuredLiveSession
        ? {
            sessionType: ensuredLiveSession.session_type,
            currentStep: ensuredLiveSession.current_step,
          }
        : undefined,
    });

    let liveSessionAfterResponse = await this.memory.getActiveLiveSession(params.userId);
    if (liveSessionAfterResponse) {
      liveSessionAfterResponse = await this.memory.advanceLiveSessionStep(
        params.userId,
        `Step ${liveSessionAfterResponse.current_step} completed for input: ${params.input}`,
      );
    }

    const liveModeSuffix = liveSessionAfterResponse
      ? `\n\n[Live Mode] ${liveSessionAfterResponse.session_type} session active. Next guidance step: ${liveSessionAfterResponse.current_step}.`
      : "";

    const finalResponse = `${result.response}${liveModeSuffix}`;

    await this.memory.addMessage(conversationId, "assistant", finalResponse, result.agent);

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
      response: finalResponse,
      toolResults: result.toolResults.map((item) => ({
        tool: item.tool,
        ok: item.ok,
        summary: item.summary,
      })),
      activeLiveSession: liveSessionAfterResponse,
    };
  }
}
