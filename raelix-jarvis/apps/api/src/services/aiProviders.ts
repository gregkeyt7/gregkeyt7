export type AiProviderName = "openai" | "gemini" | "anthropic" | "ollama" | "mock";

export interface AiProvider {
  name: AiProviderName;
  available: boolean;
  reason: string;
  generate: (prompt: string) => Promise<string>;
}

export interface AiProviderConfig {
  openAiApiKey: string;
  geminiApiKey: string;
  anthropicApiKey: string;
  ollamaBaseUrl: string;
}

const mockGenerate = async (provider: string, prompt: string): Promise<string> => {
  return `[${provider.toUpperCase()} placeholder] ${prompt}`;
};

export const createAiProviders = (config: AiProviderConfig): Record<AiProviderName, AiProvider> => ({
  openai: {
    name: "openai",
    available: Boolean(config.openAiApiKey),
    reason: config.openAiApiKey ? "API key configured" : "OPENAI_API_KEY is empty",
    generate: async (prompt) => mockGenerate("openai", prompt),
  },
  gemini: {
    name: "gemini",
    available: Boolean(config.geminiApiKey),
    reason: config.geminiApiKey ? "API key configured" : "GEMINI_API_KEY is empty",
    generate: async (prompt) => mockGenerate("gemini", prompt),
  },
  anthropic: {
    name: "anthropic",
    available: Boolean(config.anthropicApiKey),
    reason: config.anthropicApiKey ? "API key configured" : "ANTHROPIC_API_KEY is empty",
    generate: async (prompt) => mockGenerate("anthropic", prompt),
  },
  ollama: {
    name: "ollama",
    available: Boolean(config.ollamaBaseUrl),
    reason: config.ollamaBaseUrl ? `Ready to call ${config.ollamaBaseUrl}` : "OLLAMA_BASE_URL is missing",
    generate: async (prompt) => mockGenerate("ollama", prompt),
  },
  mock: {
    name: "mock",
    available: true,
    reason: "Always available fallback provider",
    generate: async (prompt) => mockGenerate("mock", prompt),
  },
});
