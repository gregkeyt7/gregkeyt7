import type { AgentContext, AgentDefinition, AgentName, AgentResult, ToolExecutionResult, ToolName } from "@raelix/shared";
import { executeTool, type ToolRuntimeContext } from "@raelix/tools";

export interface AgentRuntime {
  tools: ToolRuntimeContext;
}

const runWithTools = async (
  name: AgentName,
  input: string,
  _context: AgentContext,
  runtime: AgentRuntime,
  tools: ToolName[],
  summaryBuilder: (toolSummaries: string[]) => string,
): Promise<AgentResult> => {
  const toolResults: ToolExecutionResult[] = [];
  for (const tool of tools) {
    const result = await executeTool(tool, input, runtime.tools);
    toolResults.push(result);
  }

  const response = summaryBuilder(toolResults.map((item) => item.summary));
  return {
    agent: name,
    response,
    toolResults,
  };
};

const baseAgents = (runtime: AgentRuntime): AgentDefinition[] => [
  {
    id: "general-assistant",
    name: "General Assistant Agent",
    description: "Default conversational orchestrator for broad questions and mixed intent.",
    allowedTools: ["search_web", "read_file"],
    sampleBehavior: "Provides concise answers, then suggests specialist agents when needed.",
    run: async (input, context) =>
      runWithTools("General Assistant Agent", input, context, runtime, ["search_web"], (toolSummaries) =>
        `General Assistant ready. ${toolSummaries.join(" ")}`,
      ),
  },
  {
    id: "coding-agent",
    name: "Coding Agent",
    description: "Builds app plans, starter files, and explains code in beginner-friendly language.",
    allowedTools: ["generate_code", "create_file", "read_file", "start_live_session", "stop_live_session"],
    sampleBehavior: "Generates practical code snippets and stores outputs in data/projects.",
    run: async (input, context) => {
      const tools: ToolName[] = context.liveSession?.sessionType === "coding" ? ["generate_code"] : ["generate_code"];
      return runWithTools("Coding Agent", input, context, runtime, tools, (toolSummaries) =>
        `Coding Agent delivered a starter implementation. ${toolSummaries.join(" ")}`,
      );
    },
  },
  {
    id: "business-strategy-agent",
    name: "Business Strategy Agent",
    description: "Helps with market framing, pricing, growth ideas, and strategic prioritization.",
    allowedTools: ["search_web", "create_task"],
    sampleBehavior: "Returns tactical strategy advice and can create follow-up tasks.",
    run: async (input, context) =>
      runWithTools("Business Strategy Agent", input, context, runtime, ["search_web"], (toolSummaries) =>
        `Business insights prepared. ${toolSummaries.join(" ")}`,
      ),
  },
  {
    id: "smart-home-agent",
    name: "Smart Home Agent",
    description: "Controls lights and future home automations via mock and provider-ready adapters.",
    allowedTools: ["turn_on_light", "dim_light", "turn_off_all_lights"],
    sampleBehavior: "Parses home commands and sends the best matching device action.",
    run: async (input, context) => {
      const lower = input.toLowerCase();
      const chosenTool: ToolName = lower.includes("off")
        ? "turn_off_all_lights"
        : lower.includes("dim")
          ? "dim_light"
          : "turn_on_light";
      return runWithTools("Smart Home Agent", input, context, runtime, [chosenTool], (toolSummaries) =>
        `Smart home command executed in mock mode. ${toolSummaries.join(" ")}`,
      );
    },
  },
  {
    id: "email-agent",
    name: "Email Agent",
    description: "Prepares and reads emails using Gmail-ready placeholders.",
    allowedTools: ["send_email", "read_email"],
    sampleBehavior: "Drafts or sends email actions and confirms status in plain language.",
    run: async (input, context) => {
      const tool: ToolName = input.toLowerCase().includes("read") ? "read_email" : "send_email";
      return runWithTools("Email Agent", input, context, runtime, [tool], (toolSummaries) =>
        `Email workflow complete. ${toolSummaries.join(" ")}`,
      );
    },
  },
  {
    id: "calendar-agent",
    name: "Calendar Agent",
    description: "Creates and manages schedule placeholders for future Google Calendar integration.",
    allowedTools: ["create_calendar_event"],
    sampleBehavior: "Converts natural language scheduling requests into events.",
    run: async (input, context) =>
      runWithTools("Calendar Agent", input, context, runtime, ["create_calendar_event"], (toolSummaries) =>
        `Calendar action ready. ${toolSummaries.join(" ")}`,
      ),
  },
  {
    id: "task-agent",
    name: "Task Agent",
    description: "Captures reminders and TODOs into persistent memory.",
    allowedTools: ["create_task"],
    sampleBehavior: "Creates actionable reminders with optional due dates.",
    run: async (input, context) =>
      runWithTools("Task Agent", input, context, runtime, ["create_task"], (toolSummaries) =>
        `Task captured. ${toolSummaries.join(" ")}`,
      ),
  },
  {
    id: "kids-agent",
    name: "Family / Kids Agent",
    description: "Supports family-friendly prompts including bedtime stories and fun learning.",
    allowedTools: ["tell_bedtime_story", "create_task"],
    sampleBehavior: "Responds with age-appropriate, kind, encouraging output.",
    run: async (input, context) =>
      runWithTools("Family / Kids Agent", input, context, runtime, ["tell_bedtime_story"], (toolSummaries) =>
        `Family mode response ready. ${toolSummaries.join(" ")}`,
      ),
  },
  {
    id: "bible-faith-agent",
    name: "Bible / Faith Agent",
    description: "Provides scripture lookup and reflective responses.",
    allowedTools: ["bible_verse_lookup"],
    sampleBehavior: "Finds verses and offers compassionate, faith-centered guidance.",
    run: async (input, context) =>
      runWithTools("Bible / Faith Agent", input, context, runtime, ["bible_verse_lookup"], (toolSummaries) =>
        `Faith guidance prepared. ${toolSummaries.join(" ")}`,
      ),
  },
  {
    id: "research-agent",
    name: "Research Agent",
    description: "Collects high-level findings with source-ready placeholders.",
    allowedTools: ["search_web", "create_file"],
    sampleBehavior: "Summarizes findings and can persist notes locally.",
    run: async (input, context) =>
      runWithTools("Research Agent", input, context, runtime, ["search_web", "create_file"], (toolSummaries) =>
        `Research packet generated. ${toolSummaries.join(" ")}`,
      ),
  },
  {
    id: "file-manager-agent",
    name: "File Manager Agent",
    description: "Creates and reads local files in a controlled project directory.",
    allowedTools: ["create_file", "read_file"],
    sampleBehavior: "Performs safe file operations for generated artifacts and notes.",
    run: async (input, context) => {
      const tool: ToolName = input.toLowerCase().includes("read") ? "read_file" : "create_file";
      return runWithTools("File Manager Agent", input, context, runtime, [tool], (toolSummaries) =>
        `File manager task complete. ${toolSummaries.join(" ")}`,
      );
    },
  },
  {
    id: "printer-agent",
    name: "Printer Agent",
    description: "Prepares printable content and future printer adapter actions.",
    allowedTools: ["print_document"],
    sampleBehavior: "Generates HTML print-ready output and confirms handoff.",
    run: async (input, context) =>
      runWithTools("Printer Agent", input, context, runtime, ["print_document"], (toolSummaries) =>
        `Print payload generated. ${toolSummaries.join(" ")}`,
      ),
  },
  {
    id: "security-agent",
    name: "Security Agent",
    description: "Handles secure posture checks, access guidance, and policy reminders.",
    allowedTools: ["search_web"],
    sampleBehavior: "Provides least-privilege and secrets-handling guidance.",
    run: async (input, context) =>
      runWithTools("Security Agent", input, context, runtime, ["search_web"], (toolSummaries) =>
        `Security review prepared. ${toolSummaries.join(" ")}`,
      ),
  },
  {
    id: "education-agent",
    name: "Education Agent",
    description:
      "Teaches from beginner through expert levels with quizzes, study plans, lesson plans, and step-by-step progression.",
    allowedTools: ["create_quiz", "create_flashcards", "create_lesson_plan", "start_live_session", "stop_live_session"],
    sampleBehavior:
      "Breaks difficult topics into Step 1 first, explains like you are 12 when requested, and continues only when asked.",
    run: async (input, context) => {
      const lower = input.toLowerCase();
      const tools: ToolName[] = [];
      if (lower.includes("quiz")) {
        tools.push("create_quiz");
      }
      if (lower.includes("flashcard")) {
        tools.push("create_flashcards");
      }
      if (lower.includes("study plan") || lower.includes("lesson")) {
        tools.push("create_lesson_plan");
      }
      if (lower.includes("live") || lower.includes("learning mode")) {
        tools.push("start_live_session");
      }
      if (tools.length === 0) {
        tools.push("create_lesson_plan");
      }

      return runWithTools("Education Agent", input, context, runtime, tools, (toolSummaries) => {
        const continueRequested = lower.includes("continue") || lower.includes("next step");
        const stepGuidance = continueRequested
          ? "Continuing the lesson with the next sequence of concepts."
          : "Step 1 only: start with core vocabulary and one simple example before moving ahead.";
        return `Education mode active. ${stepGuidance} ${toolSummaries.join(" ")}`;
      });
    },
  },
  {
    id: "trading-agent",
    name: "Trading Agent",
    description:
      "Supports research, strategy planning, journaling, backtesting, and risk management with paper-trading-first guidance.",
    allowedTools: [
      "calculate_position_size",
      "create_trade_journal_entry",
      "generate_pine_script",
      "create_backtest_plan",
      "search_web",
    ],
    sampleBehavior:
      "Never promises guaranteed profit, defaults to paper testing/backtesting, and emphasizes risk controls first.",
    run: async (input, context) => {
      const lower = input.toLowerCase();
      const tools: ToolName[] = [];
      if (lower.includes("pine") || lower.includes("tradingview")) {
        tools.push("generate_pine_script");
      }
      if (lower.includes("backtest")) {
        tools.push("create_backtest_plan");
      }
      if (lower.includes("journal")) {
        tools.push("create_trade_journal_entry");
      }
      if (lower.includes("risk") || lower.includes("position")) {
        tools.push("calculate_position_size");
      }
      if (tools.length === 0) {
        tools.push("create_backtest_plan", "calculate_position_size");
      }

      return runWithTools("Trading Agent", input, context, runtime, tools, (toolSummaries) =>
        `Trading guidance ready. Safety first: no guaranteed profits, no live trade execution, and always validate with risk management plus paper testing before deployment. ${toolSummaries.join(" ")}`,
      );
    },
  },
  {
    id: "tax-lien-tax-deed-agent",
    name: "Tax Lien / Tax Deed Agent",
    description:
      "Researches tax lien and tax deed opportunities, county checklists, bid planning, redemption notes, and due diligence.",
    allowedTools: ["analyze_tax_lien_property", "create_due_diligence_checklist", "create_task"],
    sampleBehavior:
      "Highlights auction risks, legal steps, redemption timelines, and documentation checks before bidding.",
    run: async (input, context) => {
      const lower = input.toLowerCase();
      const tools: ToolName[] = ["create_due_diligence_checklist"];
      if (lower.includes("analyze") || lower.includes("property") || lower.includes("auction")) {
        tools.unshift("analyze_tax_lien_property");
      }
      return runWithTools("Tax Lien / Tax Deed Agent", input, context, runtime, tools, (toolSummaries) =>
        `Tax lien/deed research packet prepared with risk flags, redemption reminders, and bid-discipline guidance. ${toolSummaries.join(" ")}`,
      );
    },
  },
  {
    id: "cooking-live-guidance-agent",
    name: "Cooking / Live Guidance Agent",
    description:
      "Provides live, hands-free cooking guidance with recipes, measurements, substitutions, timers, and nutrition-aware adjustments.",
    allowedTools: ["create_recipe_steps", "set_cooking_timer", "start_live_session", "stop_live_session"],
    sampleBehavior:
      "Walks through one step at a time in kitchen mode and can keep guiding until the live session is stopped.",
    run: async (input, context) => {
      const lower = input.toLowerCase();
      const tools: ToolName[] = [];
      if (lower.includes("start") || lower.includes("live") || lower.includes("kitchen mode")) {
        tools.push("start_live_session");
      }
      tools.push("create_recipe_steps");
      if (lower.includes("timer") || lower.includes("bake") || lower.includes("simmer")) {
        tools.push("set_cooking_timer");
      }

      return runWithTools("Cooking / Live Guidance Agent", input, context, runtime, tools, (toolSummaries) => {
        const sessionNote = context.liveSession
          ? `Live session step ${context.liveSession.currentStep}: complete this step before requesting the next one.`
          : "Start cooking mode for continuous step-by-step guidance.";
        return `Kitchen guidance activated. ${sessionNote} ${toolSummaries.join(" ")}`;
      });
    },
  },
];

export const createAgentRegistry = (runtime: AgentRuntime): Record<AgentName, AgentDefinition> => {
  const registry = {} as Record<AgentName, AgentDefinition>;
  for (const agent of baseAgents(runtime)) {
    registry[agent.name] = agent;
  }
  return registry;
};

export const listAgents = (runtime: AgentRuntime): AgentDefinition[] => baseAgents(runtime);
