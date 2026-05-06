import type { AgentContext, AgentDefinition, AgentName, AgentResult, ToolName } from "@raelix/shared";
import { executeTool, type ToolRuntimeContext } from "@raelix/tools";

export interface AgentRuntime {
  tools: ToolRuntimeContext;
}

const runWithTools = async (
  name: AgentName,
  input: string,
  context: AgentContext,
  runtime: AgentRuntime,
  tools: ToolName[],
  summaryBuilder: (toolSummaries: string[]) => string,
): Promise<AgentResult> => {
  const toolResults = [];
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
    allowedTools: ["generate_code", "create_file", "read_file"],
    sampleBehavior: "Generates practical code snippets and stores outputs in data/projects.",
    run: async (input, context) =>
      runWithTools("Coding Agent", input, context, runtime, ["generate_code"], (toolSummaries) =>
        `Coding Agent delivered a starter implementation. ${toolSummaries.join(" ")}`,
      ),
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
];

export const createAgentRegistry = (runtime: AgentRuntime): Record<AgentName, AgentDefinition> => {
  const registry = {} as Record<AgentName, AgentDefinition>;
  for (const agent of baseAgents(runtime)) {
    registry[agent.name] = agent;
  }
  return registry;
};

export const listAgents = (runtime: AgentRuntime): AgentDefinition[] => baseAgents(runtime);
