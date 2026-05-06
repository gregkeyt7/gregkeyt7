import { Router } from "express";
import type { AgentName, UserRole } from "@raelix/shared";
import { createPrintableDocument } from "../services/printerService.js";
import { getCommunicationProviderStatus } from "../services/communicationService.js";
import { smartHomeAdapters } from "../services/smartHomeService.js";
import { getVoiceProviderStatus } from "../services/voiceService.js";
import type { BrainOrchestrator } from "../brain/orchestrator.js";
import type { MemoryStore } from "@raelix/memory";
import { env } from "../config/env.js";
import { createAiProviders } from "../services/aiProviders.js";

interface ApiRouterDependencies {
  brain: BrainOrchestrator;
  memory: MemoryStore;
}

const roleFallback = (role: string): UserRole => {
  if (role === "admin" || role === "family" || role === "child" || role === "guest") {
    return role;
  }
  return "admin";
};

export const createApiRouter = ({ brain, memory }: ApiRouterDependencies): Router => {
  const router = Router();

  const aiProviders = createAiProviders({
    openAiApiKey: env.openAiApiKey,
    geminiApiKey: env.geminiApiKey,
    anthropicApiKey: env.anthropicApiKey,
    ollamaBaseUrl: env.ollamaBaseUrl,
  });

  router.get("/health", (_req, res) => {
    res.json({ ok: true, service: "RAELIX API", timestamp: new Date().toISOString() });
  });

  router.get("/bootstrap", async (req, res) => {
    const ctx = req.raelixContext;
    if (!ctx) {
      return res.status(500).json({ error: "Missing request context" });
    }

    const user = await memory.ensureUser(ctx.userName, roleFallback(ctx.role));
    const [tasks, memories, toolLogs, conversations] = await Promise.all([
      memory.listTasks(user.id, 10),
      memory.listMemories(user.id, 10),
      memory.listToolLogs(user.id, 15),
      memory.listConversations(10),
    ]);

    return res.json({
      user,
      agents: brain.getAgentCatalog(),
      tasks,
      memories,
      toolLogs,
      conversations,
      smartHomeAdapters,
      providers: Object.values(aiProviders).map((provider) => ({
        name: provider.name,
        available: provider.available,
        reason: provider.reason,
      })),
      communication: getCommunicationProviderStatus({
        gmailClientId: env.gmailClientId,
        gmailClientSecret: env.gmailClientSecret,
        twilioAccountSid: env.twilioAccountSid,
        twilioAuthToken: env.twilioAuthToken,
        twilioPhoneNumber: env.twilioPhoneNumber,
      }),
      voice: getVoiceProviderStatus({
        openAiApiKey: env.openAiApiKey,
      }),
      availableRoles: ["admin", "family", "child", "guest"],
      availableModes: ["family", "kids", "business", "developer"],
    });
  });

  router.post("/chat", async (req, res) => {
    const ctx = req.raelixContext;
    if (!ctx) {
      return res.status(500).json({ error: "Missing request context" });
    }

    const { input, selectedAgent, conversationId } = req.body as {
      input?: string;
      selectedAgent?: AgentName;
      conversationId?: number;
    };

    if (!input || typeof input !== "string") {
      return res.status(400).json({ error: "input is required" });
    }

    const user = await memory.ensureUser(ctx.userName, roleFallback(ctx.role));
    const result = await brain.handleMessage({
      input,
      userId: user.id,
      role: ctx.role,
      mode: ctx.mode,
      selectedAgent,
      conversationId,
    });

    return res.json(result);
  });

  router.get("/conversations", async (_req, res) => {
    const conversations = await memory.listConversations(30);
    return res.json(conversations);
  });

  router.get("/conversations/:id/messages", async (req, res) => {
    const conversationId = Number(req.params.id);
    if (!Number.isFinite(conversationId)) {
      return res.status(400).json({ error: "Invalid conversation id" });
    }

    const messages = await memory.listMessages(conversationId, 200);
    return res.json(messages);
  });

  router.get("/tasks", async (req, res) => {
    const ctx = req.raelixContext;
    if (!ctx) {
      return res.status(500).json({ error: "Missing request context" });
    }

    const user = await memory.ensureUser(ctx.userName, roleFallback(ctx.role));
    const tasks = await memory.listTasks(user.id, 40);
    return res.json(tasks);
  });

  router.post("/tasks", async (req, res) => {
    const ctx = req.raelixContext;
    if (!ctx) {
      return res.status(500).json({ error: "Missing request context" });
    }

    const { title, dueDate } = req.body as { title?: string; dueDate?: string | null };
    if (!title || typeof title !== "string") {
      return res.status(400).json({ error: "title is required" });
    }

    const user = await memory.ensureUser(ctx.userName, roleFallback(ctx.role));
    const task = await memory.createTask(user.id, title, dueDate ?? null);
    return res.status(201).json(task);
  });

  router.get("/memories", async (req, res) => {
    const ctx = req.raelixContext;
    if (!ctx) {
      return res.status(500).json({ error: "Missing request context" });
    }

    const user = await memory.ensureUser(ctx.userName, roleFallback(ctx.role));
    const memories = await memory.listMemories(user.id, 40);
    return res.json(memories);
  });

  router.get("/tool-logs", async (req, res) => {
    const ctx = req.raelixContext;
    if (!ctx) {
      return res.status(500).json({ error: "Missing request context" });
    }

    const user = await memory.ensureUser(ctx.userName, roleFallback(ctx.role));
    const logs = await memory.listToolLogs(user.id, 50);
    return res.json(logs);
  });

  router.post("/print/preview", (req, res) => {
    const { title, content } = req.body as { title?: string; content?: string };
    if (!content) {
      return res.status(400).json({ error: "content is required" });
    }

    return res.json(createPrintableDocument(title ?? "RAELIX Print", content));
  });

  return router;
};
