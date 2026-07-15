import { useCallback, useEffect, useRef, useState } from "react";

type SpeechRecognitionErrorCode =
  | "aborted"
  | "audio-capture"
  | "bad-grammar"
  | "language-not-supported"
  | "network"
  | "no-speech"
  | "not-allowed"
  | "service-not-allowed"
  | (string & {});

type SpeechRecognitionAlternative = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative | undefined;
};

type SpeechRecognitionResultListLike = {
  length: number;
  [index: number]: SpeechRecognitionResultLike | undefined;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = {
  error: SpeechRecognitionErrorCode;
};

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
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

function joinTranscriptParts(parts: string[]): string {
  return parts
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ");
}

export type SpeechUnsupportedReason = "https" | "browser";

export function useSpeechRecognition() {
  const Ctor = getSpeechRecognitionCtor();
  const unsupportedReason: SpeechUnsupportedReason | null =
    typeof window === "undefined"
      ? "browser"
      : !window.isSecureContext
        ? "https"
        : Ctor
          ? null
          : "browser";
  const supported = unsupportedReason === null;

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalTranscriptRef = useRef("");
  const interimTranscriptRef = useRef("");
  const onTranscriptRef = useRef<((text: string) => void) | null>(null);
  const intentionalStopRef = useRef(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);

  const updatePreview = useCallback(() => {
    setFinalText(finalTranscriptRef.current);
  }, []);

  const resetSession = useCallback(() => {
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
    setFinalText("");
    setInterimText("");
  }, []);

  const cleanupRecognition = useCallback(() => {
    recognitionRef.current = null;
    intentionalStopRef.current = false;
    interimTranscriptRef.current = "";
    setInterimText("");
    setListening(false);
  }, []);

  const deliverTranscript = useCallback(() => {
    const spoken = joinTranscriptParts([finalTranscriptRef.current, interimTranscriptRef.current]);
    if (spoken) onTranscriptRef.current?.(spoken);
    finalTranscriptRef.current = "";
    interimTranscriptRef.current = "";
  }, []);

  const abort = useCallback(() => {
    if (!recognitionRef.current) {
      resetSession();
      return;
    }
    intentionalStopRef.current = true;
    onTranscriptRef.current = null;
    try {
      recognitionRef.current.abort();
    } catch {
      // ignore
    }
    finalTranscriptRef.current = "";
    cleanupRecognition();
  }, [cleanupRecognition, resetSession]);

  useEffect(() => () => abort(), [abort]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    intentionalStopRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch {
      deliverTranscript();
      cleanupRecognition();
    }
  }, [cleanupRecognition, deliverTranscript]);

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
      resetSession();
      onTranscriptRef.current = onTranscript;
      intentionalStopRef.current = false;

      const recognition = new Ctor();
      recognition.lang = "ru-RU";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let interim = "";

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          if (!result) continue;
          const chunk = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalTranscriptRef.current = joinTranscriptParts([finalTranscriptRef.current, chunk]);
            interimTranscriptRef.current = "";
          } else {
            interim += chunk;
          }
        }

        interimTranscriptRef.current = interim.trim();
        setInterimText(interimTranscriptRef.current);
        updatePreview();
      };

      recognition.onerror = (event) => {
        if (event.error === "aborted") return;
        if (event.error === "no-speech") {
          if (intentionalStopRef.current) return;
          return;
        }

        const message = mapSpeechError(event.error);
        if (message) setSpeechError(message);
        deliverTranscript();
        onTranscriptRef.current = null;
        cleanupRecognition();
      };

      recognition.onend = () => {
        if (intentionalStopRef.current) {
          deliverTranscript();
          cleanupRecognition();
          return;
        }

        if (!recognitionRef.current) return;

        try {
          recognitionRef.current.start();
        } catch {
          cleanupRecognition();
        }
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
    [Ctor, cleanupRecognition, deliverTranscript, resetSession, updatePreview],
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

  return {
    supported,
    unsupportedReason,
    listening,
    finalText,
    interimText,
    start,
    stop,
    toggle,
    abort,
    speechError,
    clearSpeechError: () => setSpeechError(null),
  };
}
