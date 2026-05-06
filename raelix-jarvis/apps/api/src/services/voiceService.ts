export interface VoiceProviderStatus {
  webSpeechApi: "frontend-managed";
  whisperReady: boolean;
  elevenLabsReady: boolean;
  openAiTtsReady: boolean;
}

export const getVoiceProviderStatus = (config: {
  openAiApiKey: string;
}): VoiceProviderStatus => ({
  webSpeechApi: "frontend-managed",
  whisperReady: Boolean(config.openAiApiKey),
  elevenLabsReady: false,
  openAiTtsReady: Boolean(config.openAiApiKey),
});
