import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UserRole } from "@raelix/shared";

const currentFile = fileURLToPath(import.meta.url);
const apiSrcDir = path.dirname(currentFile);
const apiDir = path.resolve(apiSrcDir, "..", "..");
const projectRoot = path.resolve(apiDir, "..", "..");
const envPath = path.join(projectRoot, ".env");

dotenv.config({ path: envPath });
dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDefaultRole = (role: string | undefined): UserRole => {
  if (role === "admin" || role === "family" || role === "child" || role === "guest") {
    return role;
  }
  return "admin";
};

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
};

export const env = {
  port: toNumber(process.env.API_PORT, 4000),
  dbPath: path.resolve(projectRoot, process.env.RAELIX_DB_PATH ?? "./data/raelix.db"),
  projectsDir: path.resolve(projectRoot, process.env.RAELIX_PROJECTS_DIR ?? "./data/projects"),
  defaultRole: parseDefaultRole(process.env.RAELIX_DEFAULT_ROLE),
  useAiRouting: parseBoolean(process.env.USE_AI_ROUTING, true),
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  gmailClientId: process.env.GMAIL_CLIENT_ID ?? "",
  gmailClientSecret: process.env.GMAIL_CLIENT_SECRET ?? "",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
};
