import type { AgentName } from "@raelix/shared";

const allowedAgents: AgentName[] = [
  "General Assistant Agent",
  "Education Agent",
  "Trading Agent",
  "Tax Lien / Tax Deed Agent",
  "Cooking / Live Guidance Agent",
  "Family / Kids Agent",
  "Smart Home Agent",
  "Task Agent",
  "Email Agent",
  "Calendar Agent",
  "Coding Agent",
  "Business Strategy Agent",
  "Bible / Faith Agent",
  "Research Agent",
  "File Manager Agent",
  "Printer Agent",
  "Security Agent",
];

const buildRouterPrompt = (input: string): string => {
  const agents = allowedAgents.map((agent) => `- ${agent}`).join("\n");
  return `You are an AI routing system. Based on the user input, select the BEST matching agent from this list. Return ONLY JSON.
User input:
${input}
Agents:
${agents}
Rules:
- Choose ONLY one agent
- Do NOT explain outside JSON
- Output format:
{
  "selectedAgent": "...",
  "reason": "..."
}`;
};

const parseRouterResult = (raw: string): { selectedAgent: AgentName; reason: string } | null => {
  const trimmed = raw.trim();
  const withoutFence = trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();

  try {
    const parsed = JSON.parse(withoutFence) as { selectedAgent?: string; reason?: string };
    if (!parsed.selectedAgent || !allowedAgents.includes(parsed.selectedAgent as AgentName)) {
      return null;
    }

    return {
      selectedAgent: parsed.selectedAgent as AgentName,
      reason: parsed.reason ?? "AI router selected agent.",
    };
  } catch {
    return null;
  }
};

const decideWithKeywordStub = (input: string): { selectedAgent: AgentName; reason: string } => {
  const lower = input.toLowerCase();

  if (["teach", "study", "quiz", "lesson", "flashcard", "learn"].some((token) => lower.includes(token))) {
    return { selectedAgent: "Education Agent", reason: "Stub router detected learning intent while API key is missing." };
  }
  if (["trade", "crypto", "forex", "backtest", "pine", "position size"].some((token) => lower.includes(token))) {
    return { selectedAgent: "Trading Agent", reason: "Stub router detected trading intent while API key is missing." };
  }
  if (["tax lien", "tax deed", "auction", "property bid"].some((token) => lower.includes(token))) {
    return { selectedAgent: "Tax Lien / Tax Deed Agent", reason: "Stub router detected tax lien/deed intent while API key is missing." };
  }
  if (["cook", "recipe", "kitchen", "ingredients", "dinner"].some((token) => lower.includes(token))) {
    return {
      selectedAgent: "Cooking / Live Guidance Agent",
      reason: "Stub router detected cooking intent while API key is missing.",
    };
  }

  return {
    selectedAgent: "General Assistant Agent",
    reason: "Stub router defaulted to general assistant because no API key is configured.",
  };
};

const withTimeout = async <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`AI router timed out after ${ms}ms`)), ms);
    }),
  ]);
};

const callOpenAiRouter = async (input: string, apiKey: string): Promise<{ selectedAgent: AgentName; reason: string }> => {
  const prompt = buildRouterPrompt(input);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI router request failed with status ${response.status}`);
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content ?? "";
  const parsed = parseRouterResult(content);
  if (!parsed) {
    throw new Error("OpenAI router returned invalid JSON payload.");
  }
  return parsed;
};

const callGeminiRouter = async (input: string, apiKey: string): Promise<{ selectedAgent: AgentName; reason: string }> => {
  const prompt = buildRouterPrompt(input);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Gemini router request failed with status ${response.status}`);
  }

  const body = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = body.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const parsed = parseRouterResult(content);
  if (!parsed) {
    throw new Error("Gemini router returned invalid JSON payload.");
  }
  return parsed;
};

export async function decideAgentWithAI(input: string): Promise<{
  selectedAgent: AgentName;
  reason: string;
}> {
  const openAiApiKey = process.env.OPENAI_API_KEY ?? "";
  const geminiApiKey = process.env.GEMINI_API_KEY ?? "";

  if (!openAiApiKey && !geminiApiKey) {
    return decideWithKeywordStub(input);
  }

  if (openAiApiKey) {
    return withTimeout(callOpenAiRouter(input, openAiApiKey), 8000);
  }

  return withTimeout(callGeminiRouter(input, geminiApiKey), 8000);
}

export const aiRouterAgentCatalog: AgentName[] = allowedAgents;
