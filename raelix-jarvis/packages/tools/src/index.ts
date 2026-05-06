import { promises as fs } from "node:fs";
import path from "node:path";
import type { ToolExecutionResult, ToolName } from "@raelix/shared";

export interface ToolRuntimeContext {
  userId: number;
  projectsDir: string;
  createTask: (title: string, dueDate: string | null) => Promise<{ id: number; title: string }>;
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
