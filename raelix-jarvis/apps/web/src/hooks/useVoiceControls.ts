import { useCallback, useMemo, useState } from "react";

type SpeechRecognitionType = {
  new (): SpeechRecognition;
};

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionType;
    SpeechRecognition?: SpeechRecognitionType;
  }
}

export const useVoiceControls = (onTranscript: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);

  const recognition = useMemo(() => {
    const Constructor = (window.SpeechRecognition || window.webkitSpeechRecognition) as SpeechRecognitionType | undefined;
    if (!Constructor) {
      return null;
    }

    const instance = new Constructor();
    instance.lang = "en-US";
    instance.interimResults = false;
    instance.continuous = false;
    instance.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results?.[0]?.[0]?.transcript;
      if (transcript) {
        onTranscript(transcript);
      }
    };
    instance.onstart = () => setIsListening(true);
    instance.onend = () => setIsListening(false);
    return instance;
  }, [onTranscript]);

  const startListening = useCallback(() => {
    recognition?.start();
  }, [recognition]);

  const stopListening = useCallback(() => {
    recognition?.stop();
  }, [recognition]);

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, []);

  return {
    isListening,
    supported: Boolean(recognition),
    startListening,
    stopListening,
    speak,
  };
};
