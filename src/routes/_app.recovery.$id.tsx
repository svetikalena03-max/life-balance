import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ExternalLink,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { useSettings } from "@/lib/settings";
import { findRecoveryItem, getRecoveryStep, type RecoveryItem } from "@/lib/recovery-data";

export const Route = createFileRoute("/_app/recovery/$id")({
  component: RecoveryDetailPage,
});

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function RecoveryDetailPage() {
  const { id } = Route.useParams();
  const { lang } = useSettings();
  const ru = lang === "ru";
  const item = findRecoveryItem(id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!item) navigate({ to: "/recovery" });
  }, [item, navigate]);

  if (!item) return null;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title={ru ? item.titleRu : item.titleEn}
        backTo="/recovery"
        backLabel={ru ? "Назад" : "Back"}
      />

      <Card className="overflow-hidden border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-500/10 p-6 text-center">
        <div className="text-6xl" aria-hidden="true">
          {item.icon}
        </div>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {ru ? item.titleRu : item.titleEn}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {item.duration} {ru ? "минут" : "minutes"}
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {ru ? "Описание" : "Description"}
        </h3>
        <p className="mt-2 text-base leading-relaxed text-foreground">
          {ru ? item.descRu : item.descEn}
        </p>
      </Card>

      {item.safetyRu && (
        <Card className="border-amber-500/40 bg-amber-500/10 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm leading-relaxed text-foreground">
              {ru ? item.safetyRu : item.safetyEn}
            </p>
          </div>
        </Card>
      )}

      {item.mode === "ambient" ? (
        <AmbientPlayer item={item} ru={ru} />
      ) : (
        <PracticePlayer item={item} ru={ru} />
      )}
    </div>
  );
}

function AmbientPlayer({ item, ru }: { item: RecoveryItem; ru: boolean }) {
  const totalSeconds = item.duration * 60;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [playbackError, setPlaybackError] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setElapsed((current) => {
        const next = current + 1;
        if (next >= totalSeconds) {
          audioRef.current?.pause();
          setRunning(false);
          setCompleted(true);
          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, totalSeconds]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  const start = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (completed || elapsed >= totalSeconds) {
      setElapsed(0);
      setCompleted(false);
      audio.currentTime = 0;
    }

    setPlaybackError(false);
    try {
      await audio.play();
      setRunning(true);
    } catch {
      setPlaybackError(true);
      setRunning(false);
    }
  };

  const toggleRunning = () => {
    if (running) {
      audioRef.current?.pause();
      setRunning(false);
      return;
    }
    void start();
  };

  const reset = () => {
    const audio = audioRef.current;
    audio?.pause();
    if (audio) audio.currentTime = 0;
    setRunning(false);
    setElapsed(0);
    setCompleted(false);
    setPlaybackError(false);
  };

  const progress = Math.min(100, (elapsed / totalSeconds) * 100);

  return (
    <Card className="overflow-hidden p-5">
      <audio ref={audioRef} src={item.audio?.src} loop preload="metadata" />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {completed
              ? ru
                ? "Прослушивание завершено"
                : "Listening complete"
              : ru
                ? "Осталось"
                : "Remaining"}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
            {formatTime(Math.max(0, totalSeconds - elapsed))}
          </p>
        </div>
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full text-3xl transition-all ${
            running ? "scale-110 bg-emerald-500/20 shadow-lg" : "bg-muted"
          }`}
          aria-hidden="true"
        >
          {item.icon}
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="my-6 rounded-2xl bg-emerald-500/10 p-4">
        <label className="flex items-center gap-3 text-sm font-medium text-foreground">
          {volume === 0 ? (
            <VolumeX className="h-5 w-5 shrink-0" />
          ) : (
            <Volume2 className="h-5 w-5 shrink-0" />
          )}
          <span className="sr-only">{ru ? "Громкость" : "Volume"}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            className="h-2 w-full cursor-pointer accent-emerald-600"
            aria-label={ru ? "Громкость" : "Volume"}
          />
          <span className="w-10 text-right tabular-nums">{Math.round(volume * 100)}%</span>
        </label>
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {completed
            ? ru
              ? "Готово. Можно повторить или выбрать другой звук."
              : "Done. You can repeat or choose another sound."
            : running
              ? ru
                ? "Звук играет и будет повторяться до конца таймера."
                : "The sound is playing and will loop until the timer ends."
              : ru
                ? "Нажмите «Включить звук», когда будете готовы."
                : "Press Play sound when you are ready."}
        </p>
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button
          size="lg"
          className="h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-base text-white"
          onClick={toggleRunning}
        >
          {running ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
          {running
            ? ru
              ? "Пауза"
              : "Pause"
            : completed
              ? ru
                ? "Повторить"
                : "Repeat"
              : elapsed > 0
                ? ru
                  ? "Продолжить"
                  : "Continue"
                : ru
                  ? "Включить звук"
                  : "Play sound"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-14 w-14"
          aria-label={ru ? "Начать заново" : "Reset"}
          onClick={reset}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {playbackError && (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
          {ru
            ? "Не удалось включить звук. Проверьте интернет и попробуйте ещё раз."
            : "Could not play the sound. Check your connection and try again."}
        </p>
      )}

      {item.audio && (
        <a
          href={item.audio.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {ru ? item.audio.creditRu : item.audio.creditEn}
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </Card>
  );
}

function PracticePlayer({ item, ru }: { item: RecoveryItem; ru: boolean }) {
  const totalSeconds = item.duration * 60;
  const musicRef = useRef<HTMLAudioElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.16);
  const lastSpokenStep = useRef(-1);
  const currentStep = getRecoveryStep(item, elapsed);
  const currentStepIndex = currentStep ? (item.steps?.indexOf(currentStep) ?? -1) : -1;
  const speechAvailable = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!running) return;

    const timer = window.setInterval(() => {
      setElapsed((current) => {
        const next = current + 1;
        if (next >= totalSeconds) {
          musicRef.current?.pause();
          setRunning(false);
          setCompleted(true);
          return totalSeconds;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, totalSeconds]);

  useEffect(() => {
    const music = musicRef.current;
    if (music) music.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    if (
      !running ||
      !voiceEnabled ||
      !speechAvailable ||
      item.mode !== "guided" ||
      !currentStep ||
      currentStepIndex === lastSpokenStep.current
    ) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ru ? currentStep.ru : currentStep.en);
    utterance.lang = ru ? "ru-RU" : "en-US";
    utterance.rate = 0.86;
    utterance.pitch = 0.95;
    const matchingVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith(ru ? "ru" : "en"));
    if (matchingVoice) utterance.voice = matchingVoice;
    window.speechSynthesis.speak(utterance);
    lastSpokenStep.current = currentStepIndex;
  }, [currentStep, currentStepIndex, item.mode, ru, running, speechAvailable, voiceEnabled]);

  useEffect(() => {
    const music = musicRef.current;
    return () => {
      music?.pause();
      if (speechAvailable) window.speechSynthesis.cancel();
    };
  }, [speechAvailable]);

  const start = async () => {
    if (completed || elapsed >= totalSeconds) {
      setElapsed(0);
      setCompleted(false);
      lastSpokenStep.current = -1;
      if (musicRef.current) musicRef.current.currentTime = 0;
    }

    if (musicEnabled && musicRef.current) {
      try {
        await musicRef.current.play();
      } catch {
        setMusicEnabled(false);
      }
    }
    setRunning(true);
  };

  const toggleRunning = () => {
    if (running) {
      musicRef.current?.pause();
      if (speechAvailable) window.speechSynthesis.cancel();
      setRunning(false);
      return;
    }
    void start();
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setCompleted(false);
    lastSpokenStep.current = -1;
    musicRef.current?.pause();
    if (musicRef.current) musicRef.current.currentTime = 0;
    if (speechAvailable) window.speechSynthesis.cancel();
  };

  const toggleVoice = () => {
    setVoiceEnabled((current) => {
      if (current && speechAvailable) window.speechSynthesis.cancel();
      if (!current) lastSpokenStep.current = -1;
      return !current;
    });
  };

  const toggleMusic = () => {
    setMusicEnabled((current) => {
      const next = !current;
      if (!next) {
        musicRef.current?.pause();
      } else if (running) {
        void musicRef.current?.play();
      }
      return next;
    });
  };

  const progress = Math.min(100, (elapsed / totalSeconds) * 100);

  return (
    <Card className="overflow-hidden p-5">
      <audio ref={musicRef} src="/audio/calm-background.mp3" loop preload="metadata" />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {completed
              ? ru
                ? "Практика завершена"
                : "Practice complete"
              : ru
                ? "Осталось"
                : "Remaining"}
          </p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
            {formatTime(Math.max(0, totalSeconds - elapsed))}
          </p>
        </div>
        <div className="flex gap-2">
          {item.mode === "guided" && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={
                voiceEnabled
                  ? ru
                    ? "Выключить голос"
                    : "Mute voice"
                  : ru
                    ? "Включить голос"
                    : "Enable voice"
              }
              onClick={toggleVoice}
              disabled={!speechAvailable}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={
              musicEnabled
                ? ru
                  ? "Выключить музыку"
                  : "Mute music"
                : ru
                  ? "Включить музыку"
                  : "Enable music"
            }
            onClick={toggleMusic}
          >
            {musicEnabled ? <Music2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-4 rounded-2xl bg-sky-500/10 px-4 py-3">
        <label className="flex items-center gap-3 text-sm font-medium text-foreground">
          <Music2 className="h-4 w-4 shrink-0 text-sky-700 dark:text-sky-300" />
          <span className="shrink-0">{ru ? "Музыка" : "Music"}</span>
          <input
            type="range"
            min="0"
            max="0.35"
            step="0.01"
            value={musicVolume}
            onChange={(event) => setMusicVolume(Number(event.target.value))}
            disabled={!musicEnabled}
            className="h-2 w-full cursor-pointer accent-sky-600 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={ru ? "Громкость фоновой музыки" : "Background music volume"}
          />
          <span className="w-10 text-right tabular-nums">
            {musicEnabled ? `${Math.round((musicVolume / 0.35) * 100)}%` : "0%"}
          </span>
        </label>
      </div>

      {item.mode === "breathing" ? (
        <BreathingGuide item={item} elapsed={elapsed} running={running} ru={ru} />
      ) : (
        <div className="my-6 flex min-h-40 items-center rounded-2xl bg-emerald-500/10 p-5 text-center">
          <p className="w-full text-base leading-relaxed text-foreground">
            {completed
              ? ru
                ? "Вы закончили практику. Отметьте, как изменилось ваше состояние."
                : "You completed the practice. Notice how you feel now."
              : currentStep
                ? ru
                  ? currentStep.ru
                  : currentStep.en
                : ru
                  ? "Нажмите «Начать», когда будете готовы."
                  : "Press Start when you are ready."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Button
          size="lg"
          className="h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-base text-white"
          onClick={toggleRunning}
        >
          {running ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
          {running
            ? ru
              ? "Пауза"
              : "Pause"
            : completed
              ? ru
                ? "Повторить"
                : "Repeat"
              : elapsed > 0
                ? ru
                  ? "Продолжить"
                  : "Continue"
                : ru
                  ? "Начать"
                  : "Start"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-14 w-14"
          aria-label={ru ? "Начать заново" : "Reset"}
          onClick={reset}
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {item.mode === "guided" && !speechAvailable && (
        <p className="mt-3 text-xs text-muted-foreground">
          {ru
            ? "На этом устройстве голос недоступен, но текст и таймер работают."
            : "Voice is unavailable on this device, but text and timer still work."}
        </p>
      )}
    </Card>
  );
}

function BreathingGuide({
  item,
  elapsed,
  running,
  ru,
}: {
  item: RecoveryItem;
  elapsed: number;
  running: boolean;
  ru: boolean;
}) {
  const pattern = item.breathing ?? { inhale: 4, hold: 2, exhale: 6 };
  const cycle = pattern.inhale + pattern.hold + pattern.exhale;
  const point = elapsed % cycle;

  const phase = useMemo(() => {
    if (!running && elapsed === 0)
      return { labelRu: "Приготовьтесь", labelEn: "Get ready", remaining: 0, scale: 0.82 };
    if (point < pattern.inhale) {
      return { labelRu: "Вдох", labelEn: "Inhale", remaining: pattern.inhale - point, scale: 1.12 };
    }
    if (point < pattern.inhale + pattern.hold) {
      return {
        labelRu: "Пауза",
        labelEn: "Hold",
        remaining: pattern.inhale + pattern.hold - point,
        scale: 1.12,
      };
    }
    return { labelRu: "Выдох", labelEn: "Exhale", remaining: cycle - point, scale: 0.82 };
  }, [cycle, elapsed, pattern.hold, pattern.inhale, point, running]);

  return (
    <div className="my-7 flex min-h-56 flex-col items-center justify-center" aria-live="polite">
      <div
        className="flex h-36 w-36 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-center text-white shadow-lg transition-transform duration-1000 ease-in-out"
        style={{ transform: `scale(${phase.scale})` }}
      >
        <div>
          <p className="text-xl font-semibold">{ru ? phase.labelRu : phase.labelEn}</p>
          {running && <p className="mt-1 text-3xl font-bold tabular-nums">{phase.remaining}</p>}
        </div>
      </div>
      <p className="mt-5 text-sm text-muted-foreground">
        {ru ? "Вдох 4 · пауза 2 · выдох 6" : "Inhale 4 · hold 2 · exhale 6"}
      </p>
    </div>
  );
}
