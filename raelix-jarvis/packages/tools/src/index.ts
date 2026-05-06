import { promises as fs } from "node:fs";
import path from "node:path";
import type { LiveSession, LiveSessionType, ToolExecutionResult, ToolName } from "@raelix/shared";

export interface ToolRuntimeContext {
  userId: number;
  projectsDir: string;
  createTask: (title: string, dueDate: string | null) => Promise<{ id: number; title: string }>;
  createStudySession: (subject: string, plan: string) => Promise<number>;
  createTradeJournalEntry: (entry: string) => Promise<number>;
  createWatchedAsset: (symbol: string, assetType: string, notes: string) => Promise<number>;
  createTaxLienProperty: (propertyRef: string, county: string, notes: string) => Promise<number>;
  createRecipe: (recipeName: string, steps: string) => Promise<number>;
  startLiveSession: (sessionType: LiveSessionType, notes?: string) => Promise<LiveSession>;
  stopLiveSession: (notes?: string) => Promise<LiveSession | null>;
}

export type ToolHandler = (input: string, context: ToolRuntimeContext) => Promise<ToolExecutionResult>;

const mock = (tool: ToolName, summary: string, payload?: Record<string, unknown>): ToolExecutionResult => ({
  tool,
  ok: true,
  summary,
  payload,
});

const extractTitleAndDueDate = (input: string): { title: string; dueDate: string | null } => {
  const lower = input.toLowerCase();
  const dueDate = lower.includes("tomorrow") ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;
  return {
    title: input.replace(/create|reminder|task|for tomorrow/gi, "").trim() || "Untitled task",
    dueDate,
  };
};

const parseLiveType = (input: string): LiveSessionType => {
  const lower = input.toLowerCase();
  if (lower.includes("cook") || lower.includes("kitchen")) {
    return "cooking";
  }
  if (lower.includes("learn") || lower.includes("study") || lower.includes("education")) {
    return "education";
  }
  if (lower.includes("workout")) {
    return "workout";
  }
  if (lower.includes("code")) {
    return "coding";
  }
  return "project";
};

export const toolRegistry: Record<ToolName, ToolHandler> = {
  send_email: async (input) => mock("send_email", `Mock email queued: ${input}`),
  read_email: async () => mock("read_email", "Mock inbox read complete", { unreadCount: 3 }),
  send_text: async (input) => mock("send_text", `Mock text sent: ${input}`),
  make_phone_call: async (input) => mock("make_phone_call", `Mock call initiated: ${input}`),
  create_calendar_event: async (input) => mock("create_calendar_event", `Mock calendar event created: ${input}`),
  create_task: async (input, context) => {
    const { title, dueDate } = extractTitleAndDueDate(input);
    const task = await context.createTask(title, dueDate);
    return mock("create_task", `Task created: ${task.title}`, { taskId: task.id, dueDate });
  },
  turn_on_light: async (input) => mock("turn_on_light", `Smart home mock: ${input}`),
  dim_light: async (input) => {
    const levelMatch = input.match(/(\d+)%?/);
    const level = levelMatch ? Number(levelMatch[1]) : 40;
    return mock("dim_light", `Smart home mock dim applied at ${level}%`, { level });
  },
  turn_off_all_lights: async () => mock("turn_off_all_lights", "Smart home mock: all lights turned off"),
  print_document: async (input) => {
    const html = `<html><body><h1>RAELIX Printable Document</h1><p>${input}</p></body></html>`;
    return mock("print_document", "Printable HTML generated for browser print", { html });
  },
  search_web: async (input) => mock("search_web", `Mock web search results prepared for: ${input}`),
  create_file: async (input, context) => {
    const fileName = `note-${Date.now()}.md`;
    const target = path.join(context.projectsDir, fileName);
    await fs.mkdir(context.projectsDir, { recursive: true });
    await fs.writeFile(target, `# RAELIX Note\n\n${input}\n`, "utf8");
    return mock("create_file", `File created at ${target}`, { fileName });
  },
  read_file: async (input) => mock("read_file", `Mock file read for path: ${input}`),
  generate_code: async (input, context) => {
    const fileName = `generated-${Date.now()}.ts`;
    const target = path.join(context.projectsDir, fileName);
    const content = `export const generatedByRaelix = () => \"${input.replaceAll("\"", "")}\";\n`;
    await fs.mkdir(context.projectsDir, { recursive: true });
    await fs.writeFile(target, content, "utf8");
    return mock("generate_code", `Starter code generated at ${target}`, { fileName });
  },
  tell_bedtime_story: async (input) => {
    const childName = input.match(/tell\s+(\w+)/i)?.[1] ?? "friend";
    return mock(
      "tell_bedtime_story",
      `Once upon a glowing moon, ${childName} and RAELIX explored a gentle galaxy where kindness powered every star.`,
    );
  },
  bible_verse_lookup: async () =>
    mock("bible_verse_lookup", "Philippians 4:13 — I can do all things through Christ who strengthens me."),

  create_quiz: async (input, context) => {
    const sessionId = await context.createStudySession("General", `Quiz prep for: ${input}`);
    return mock("create_quiz", `Quiz generated for topic: ${input}`, { sessionId, questions: 5 });
  },
  create_flashcards: async (input, context) => {
    const sessionId = await context.createStudySession("General", `Flashcards for: ${input}`);
    return mock("create_flashcards", `Flashcards created for: ${input}`, { sessionId, cards: 10 });
  },
  create_lesson_plan: async (input, context) => {
    const sessionId = await context.createStudySession("General", `Lesson plan for: ${input}`);
    return mock("create_lesson_plan", `Lesson plan drafted for: ${input}`, { sessionId });
  },
  calculate_position_size: async (input) => {
    return mock(
      "calculate_position_size",
      "Position sizing calculated in mock mode with risk-first assumptions.",
      { guidance: "Use 1-2% max account risk per trade, validate with broker rules." },
    );
  },
  create_trade_journal_entry: async (input, context) => {
    const entryId = await context.createTradeJournalEntry(input);
    return mock("create_trade_journal_entry", "Trade journal entry saved.", { entryId });
  },
  generate_pine_script: async (input, context) => {
    const fileName = `pine-strategy-${Date.now()}.pine`;
    const target = path.join(context.projectsDir, fileName);
    const template = `//@version=5\nstrategy(\"RAELIX Strategy\", overlay=true)\n// ${input}\nlongCondition = ta.crossover(ta.sma(close, 9), ta.sma(close, 21))\nif (longCondition)\n    strategy.entry(\"Long\", strategy.long)\n`;
    await fs.mkdir(context.projectsDir, { recursive: true });
    await fs.writeFile(target, template, "utf8");
    return mock("generate_pine_script", `Pine Script template generated at ${target}`, { fileName });
  },
  create_backtest_plan: async (input) =>
    mock("create_backtest_plan", `Backtest plan created for strategy: ${input}`, {
      checklist: ["Define timeframe", "Set risk rules", "Run out-of-sample test"],
    }),
  analyze_tax_lien_property: async (input, context) => {
    const propertyId = await context.createTaxLienProperty("Unknown parcel", "Unknown county", input);
    return mock("analyze_tax_lien_property", "Tax lien property analysis draft saved.", { propertyId });
  },
  create_due_diligence_checklist: async (input) =>
    mock("create_due_diligence_checklist", `Due diligence checklist generated for: ${input}`, {
      items: ["Lien priority", "Redemption window", "Title issues", "County auction terms"],
    }),
  start_live_session: async (input, context) => {
    const sessionType = parseLiveType(input);
    const session = await context.startLiveSession(sessionType, input);
    return mock("start_live_session", `Live ${sessionType} session started.`, { session });
  },
  stop_live_session: async (input, context) => {
    const session = await context.stopLiveSession(input || "Stopped by user");
    return mock("stop_live_session", session ? "Live session ended." : "No active live session to stop.", { session });
  },
  set_cooking_timer: async (input) => {
    const match = input.match(/(\d+)/);
    const minutes = match ? Number(match[1]) : 10;
    return mock("set_cooking_timer", `Mock timer set for ${minutes} minutes.`, { minutes });
  },
  create_recipe_steps: async (input, context) => {
    const recipeId = await context.createRecipe("RAELIX Recipe", input);
    return mock("create_recipe_steps", "Recipe steps created for live cooking guidance.", { recipeId });
  },
};

export const executeTool = async (
  tool: ToolName,
  input: string,
  context: ToolRuntimeContext,
): Promise<ToolExecutionResult> => {
  const handler = toolRegistry[tool];
  if (!handler) {
    return {
      tool,
      ok: false,
      summary: `Tool ${tool} is not registered`,
    };
  }

  return handler(input, context);
};
