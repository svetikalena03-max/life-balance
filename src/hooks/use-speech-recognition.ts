import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined" || !window.isSecureContext) return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function mapSpeechError(error: string): string | null {
  switch (error) {
    case "aborted":
      return null;
    case "not-allowed":
    case "service-not-allowed":
      return "Нет доступа к микрофону. Разрешите использование микрофона в настройках браузера.";
    case "no-speech":
      return "Речь не распознана. Попробуйте ещё раз и говорите чуть громче.";
    case "audio-capture":
      return "Микрофон не найден. Подключите микрофон или введите текст вручную.";
    case "network":
      return "Нет связи с сервисом распознавания речи. Проверьте интернет или введите текст вручную.";
    case "language-not-supported":
      return "Русский язык не поддерживается в этом браузере. Введите текст вручную.";
    default:
      return `Не удалось распознать речь (${error}). Введите текст вручную.`;
  }
}

export function useSpeechRecognition() {
  const Ctor = getSpeechRecognitionCtor();
  const supported = Ctor !== null;

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const transcriptRef = useRef("");
  const onTranscriptRef = useRef<((text: string) => void) | null>(null);
  const intentionalStopRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const cleanupRecognition = useCallback(() => {
    recognitionRef.current = null;
    transcriptRef.current = "";
    intentionalStopRef.current = false;
    setListening(false);
  }, []);

  const abort = useCallback(() => {
    if (!recognitionRef.current) return;
    intentionalStopRef.current = true;
    try {
      recognitionRef.current.abort();
    } catch {
      // ignore
    }
    cleanupRecognition();
  }, [cleanupRecognition]);

  useEffect(() => () => abort(), [abort]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    intentionalStopRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch {
      cleanupRecognition();
    }
  }, [cleanupRecognition]);

  const start = useCallback(
    (onTranscript: (text: string) => void) => {
      if (!Ctor) return;

      if (recognitionRef.current) {
        intentionalStopRef.current = true;
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
        cleanupRecognition();
      }

      setSpeechError(null);
      transcriptRef.current = "";
      onTranscriptRef.current = onTranscript;
      intentionalStopRef.current = false;

      const recognition = new Ctor();
      recognition.lang = "ru-RU";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let full = "";
        for (let i = 0; i < event.results.length; i += 1) {
          full += event.results[i][0]?.transcript ?? "";
        }
        transcriptRef.current = full;
      };

      recognition.onerror = (event) => {
        if (event.error === "aborted") return;
        if (event.error === "no-speech" && intentionalStopRef.current) return;

        const message = mapSpeechError(event.error);
        if (message) setSpeechError(message);
        cleanupRecognition();
      };

      recognition.onend = () => {
        const spoken = transcriptRef.current.trim();
        if (spoken) onTranscriptRef.current?.(spoken);
        cleanupRecognition();
      };

      recognitionRef.current = recognition;
      setListening(true);

      try {
        recognition.start();
      } catch {
        setSpeechError("Не удалось запустить распознавание речи. Попробуйте ещё раз.");
        cleanupRecognition();
      }
    },
    [Ctor, cleanupRecognition],
  );

  const toggle = useCallback(
    (onTranscript: (text: string) => void) => {
      if (listening) {
        stop();
        return;
      }
      start(onTranscript);
    },
    [listening, start, stop],
  );

  return { supported, listening, toggle, stop, abort, speechError, clearSpeechError: () => setSpeechError(null) };
}
