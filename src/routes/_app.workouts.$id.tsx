import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { todayISO, useEntries } from "@/lib/store";
import { getWorkout, getWorkoutMinutes, type WorkoutVisual } from "@/lib/workout-data";

export const Route = createFileRoute("/_app/workouts/$id")({
  component: WorkoutPlayerPage,
});

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function WorkoutPlayerPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const workout = getWorkout(id);

  useEffect(() => {
    if (!workout) navigate({ to: "/workouts" });
  }, [navigate, workout]);

  if (!workout) return null;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <PageHeader title={workout.title} backTo="/workouts" backLabel="Все тренировки" />
      <WorkoutPlayer workout={workout} />
    </div>
  );
}

function WorkoutPlayer({ workout }: { workout: NonNullable<ReturnType<typeof getWorkout>> }) {
  const { saveEntry, saving } = useEntries();
  const [index, setIndex] = useState(0);
  const [remaining, setRemaining] = useState(workout.exercises[0].seconds);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [saved, setSaved] = useState(false);
  const spokenIndex = useRef(-1);
  const exercise = workout.exercises[index];
  const totalSeconds = useMemo(
    () => workout.exercises.reduce((sum, item) => sum + item.seconds, 0),
    [workout.exercises],
  );
  const completedSeconds =
    workout.exercises.slice(0, index).reduce((sum, item) => sum + item.seconds, 0) +
    (exercise.seconds - remaining);
  const progress = complete ? 100 : Math.min(100, (completedSeconds / totalSeconds) * 100);
  const speechAvailable = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!running || complete) return;
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current > 1) return current - 1;
        if (index >= workout.exercises.length - 1) {
          setRunning(false);
          setComplete(true);
          return 0;
        }
        setIndex((currentIndex) => currentIndex + 1);
        return workout.exercises[index + 1].seconds;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [complete, index, running, workout.exercises]);

  useEffect(() => {
    if (!running || !voiceEnabled || !speechAvailable || spokenIndex.current === index) return;
    window.speechSynthesis.cancel();
    const message = new SpeechSynthesisUtterance(`${exercise.title}. ${exercise.instruction}`);
    message.lang = "ru-RU";
    message.rate = 0.92;
    const voice = window.speechSynthesis
      .getVoices()
      .find((candidate) => candidate.lang.toLowerCase().startsWith("ru"));
    if (voice) message.voice = voice;
    window.speechSynthesis.speak(message);
    spokenIndex.current = index;
  }, [exercise, index, running, speechAvailable, voiceEnabled]);

  useEffect(() => {
    return () => {
      if (speechAvailable) window.speechSynthesis.cancel();
    };
  }, [speechAvailable]);

  const moveTo = (nextIndex: number) => {
    if (nextIndex < 0 || nextIndex >= workout.exercises.length) return;
    window.speechSynthesis?.cancel();
    setIndex(nextIndex);
    setRemaining(workout.exercises[nextIndex].seconds);
    setComplete(false);
    setSaved(false);
    spokenIndex.current = -1;
  };

  const reset = () => {
    window.speechSynthesis?.cancel();
    setIndex(0);
    setRemaining(workout.exercises[0].seconds);
    setRunning(false);
    setComplete(false);
    setSaved(false);
    spokenIndex.current = -1;
  };

  const saveWorkout = async () => {
    const result = await saveEntry({
      date: todayISO(),
      workout: workout.title,
      workoutMinutes: getWorkoutMinutes(workout),
    });
    if (!result.ok) {
      toast.error(result.error ?? "Не удалось сохранить тренировку");
      return;
    }
    setSaved(true);
    toast.success("Тренировка записана в дневник");
  };

  return (
    <>
      <Card className="overflow-hidden p-0">
        <div className={`bg-gradient-to-br ${workout.accent} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {complete
                  ? "Тренировка завершена"
                  : `Упражнение ${index + 1} из ${workout.exercises.length}`}
              </p>
              <h2 className="mt-1 text-xl font-bold text-foreground">
                {complete ? "Отличная работа!" : exercise.title}
              </h2>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setVoiceEnabled((current) => !current);
                window.speechSynthesis?.cancel();
                spokenIndex.current = -1;
              }}
              disabled={!speechAvailable}
              aria-label={voiceEnabled ? "Выключить голос" : "Включить голос"}
            >
              {voiceEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-card/60">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="p-5">
          {complete ? (
            <div className="flex min-h-72 flex-col items-center justify-center text-center">
              <span className="grid h-24 w-24 place-items-center rounded-full bg-emerald-500/15 text-5xl">
                🎉
              </span>
              <p className="mt-5 text-lg font-semibold text-foreground">
                Вы выполнили комплекс за {getWorkoutMinutes(workout)} минут
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Спокойно восстановите дыхание и выпейте воды, если хочется.
              </p>
            </div>
          ) : (
            <>
              <WorkoutVisualDemo visual={exercise.visual} running={running} />
              <p className="text-center text-5xl font-bold tabular-nums text-foreground">
                {formatTime(remaining)}
              </p>
              <div className="mt-5 rounded-2xl bg-muted/70 p-4">
                <p className="text-base leading-relaxed text-foreground">{exercise.instruction}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  💡 {exercise.tip}
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {complete ? (
        <div className="grid gap-2">
          <Button
            size="lg"
            className="h-14 text-base"
            onClick={() => void saveWorkout()}
            disabled={saving || saved}
          >
            <Check className="mr-2 h-5 w-5" />
            {saved ? "Записано в дневник" : saving ? "Сохраняем…" : "Записать в дневник"}
          </Button>
          <Button variant="outline" size="lg" className="h-12" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Повторить тренировку
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-[auto_1fr_auto] gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14"
            onClick={() => moveTo(index - 1)}
            disabled={index === 0}
            aria-label="Предыдущее упражнение"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            size="lg"
            className="h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-base text-white"
            onClick={() => setRunning((current) => !current)}
          >
            {running ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {running ? "Пауза" : completedSeconds > 0 ? "Продолжить" : "Начать"}
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-14 w-14"
            onClick={() => moveTo(index + 1)}
            disabled={index === workout.exercises.length - 1}
            aria-label="Следующее упражнение"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}

      <Card className="border-amber-500/25 bg-amber-500/5 p-4 text-sm leading-relaxed text-muted-foreground">
        Делайте движения в комфортной амплитуде. При боли, головокружении, выраженной одышке или
        плохом самочувствии остановитесь.
      </Card>
    </>
  );
}

function WorkoutVisualDemo({ visual, running }: { visual: WorkoutVisual; running: boolean }) {
  const media: Record<
    WorkoutVisual,
    { src: string; kind: "video" | "image"; alt: string; source: string }
  > = {
    arms: {
      src: "/workouts/arms-stretch.mp4",
      kind: "video",
      alt: "Женщина мягко растягивает руки и плечи",
      source: "https://www.pexels.com/video/woman-stretching-arms-6446121/",
    },
    march: {
      src: "/workouts/march.mp4",
      kind: "video",
      alt: "Женщина выполняет шаги на месте",
      source: "https://www.pexels.com/video/a-woman-stationary-walking-exercise-at-home-4267362/",
    },
    squat: {
      src: "/workouts/squat.mp4",
      kind: "video",
      alt: "Женщина показывает неглубокое приседание",
      source: "https://www.pexels.com/video/woman-doing-squats-8026509/",
    },
    wallPushup: {
      src: "/workouts/wall-pushup.gif",
      kind: "image",
      alt: "Демонстрация отжимания от стены",
      source:
        "https://commons.wikimedia.org/wiki/File:Wallpushup-CDC_strength_training_for_older_adults.gif",
    },
    sideStretch: {
      src: "/workouts/side-stretch.mp4",
      kind: "video",
      alt: "Женщина выполняет мягкое потягивание в сторону",
      source: "https://www.pexels.com/video/a-woman-doing-side-to-side-body-stretches-3048925/",
    },
    hipAbduction: {
      src: "/workouts/hip-abduction.gif",
      kind: "image",
      alt: "Демонстрация отведения ноги в сторону у опоры",
      source:
        "https://commons.wikimedia.org/wiki/File:Hip_abduction-CDC_strength_training_for_older_adults.gif",
    },
    kneeExtension: {
      src: "/workouts/knee-extension.gif",
      kind: "image",
      alt: "Демонстрация разгибания ноги сидя",
      source:
        "https://commons.wikimedia.org/wiki/File:Knee_extension-CDC_strength_training_for_older_adults.gif",
    },
    overheadPress: {
      src: "/workouts/overhead-press.gif",
      kind: "image",
      alt: "Демонстрация подъёма рук вверх сидя",
      source:
        "https://commons.wikimedia.org/wiki/File:Overhead_press-CDC_strength_training_for_older_adults.gif",
    },
    toeStand: {
      src: "/workouts/toe-stand.gif",
      kind: "image",
      alt: "Демонстрация подъёма на носки у опоры",
      source:
        "https://commons.wikimedia.org/wiki/File:Toe_stand-CDC_strength_training_for_older_adults.gif",
    },
    backStretch: {
      src: "/workouts/back-stretch.gif",
      kind: "image",
      alt: "Демонстрация мягкой растяжки плеч и спины",
      source:
        "https://commons.wikimedia.org/wiki/File:Backstretch-CDC_strength_training_for_older_adults.gif",
    },
    hamstringStretch: {
      src: "/workouts/hamstring-stretch.gif",
      kind: "image",
      alt: "Демонстрация растяжки задней поверхности бедра сидя",
      source:
        "https://commons.wikimedia.org/wiki/File:Hamstring_stretch-CDC_strength_training_for_older_adults.gif",
    },
  };
  const current = media[visual];

  return (
    <div className="relative mb-4 overflow-hidden rounded-3xl border border-emerald-500/15 bg-gradient-to-b from-emerald-500/10 to-sky-500/10 shadow-sm">
      <div className="flex h-72 items-center justify-center bg-white/75 dark:bg-slate-950/40">
        {current.kind === "video" ? (
          <video
            key={current.src}
            src={current.src}
            className="h-full w-full object-contain"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={current.alt}
          />
        ) : (
          <img src={current.src} alt={current.alt} className="h-full w-full object-contain p-3" />
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-4 pb-3 pt-10 text-white">
        <span className="rounded-full bg-black/35 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
          {running ? "Повторяйте в своём темпе" : "Посмотрите движение"}
        </span>
        <a
          href={current.source}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-white/80 underline decoration-white/40 underline-offset-2"
        >
          Источник
        </a>
      </div>
    </div>
  );
}
