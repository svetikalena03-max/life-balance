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
import {
  getWorkout,
  getWorkoutMinutes,
  type WorkoutExercise,
  type WorkoutVisual,
} from "@/lib/workout-data";

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
  const labels: Record<WorkoutVisual, string> = {
    warmup: "Плавное движение",
    march: "Поочерёдно",
    squat: "Таз назад и вверх",
    push: "К опоре и обратно",
    step: "Вправо и влево",
    chair: "С устойчивой опорой",
    stretch: "Мягко потянуться",
    breath: "Спокойный вдох и выдох",
  };

  return (
    <div className="mb-4 flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-emerald-500/10 to-sky-500/10">
      <svg
        viewBox="0 0 220 210"
        className={`h-48 w-48 ${running ? `workout-${visual}` : ""}`}
        role="img"
        aria-label={`Схема движения: ${labels[visual]}`}
      >
        {visual === "chair" ? (
          <>
            <g stroke="currentColor" strokeWidth="6" opacity="0.3" strokeLinecap="round">
              <line x1="70" y1="118" x2="154" y2="118" />
              <line x1="74" y1="118" x2="74" y2="190" />
              <line x1="154" y1="70" x2="154" y2="190" />
            </g>
            <g
              className="workout-body"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="108" cy="36" r="19" className="fill-emerald-400 stroke-none" />
              <line x1="108" y1="63" x2="108" y2="113" />
              <line className="workout-arm-left" x1="106" y1="76" x2="72" y2="104" />
              <line className="workout-arm-right" x1="110" y1="76" x2="143" y2="104" />
              <polyline className="workout-leg-left" points="105,112 68,135 68,178" fill="none" />
              <polyline
                className="workout-leg-right"
                points="111,112 145,135 145,178"
                fill="none"
              />
            </g>
          </>
        ) : visual === "push" ? (
          <>
            <line
              x1="178"
              y1="28"
              x2="178"
              y2="190"
              stroke="currentColor"
              strokeWidth="7"
              opacity="0.25"
              strokeLinecap="round"
            />
            <g
              className="workout-body"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
            >
              <circle cx="104" cy="43" r="19" className="fill-emerald-400 stroke-none" />
              <line x1="110" y1="69" x2="122" y2="126" />
              <line className="workout-arm-left" x1="112" y1="76" x2="168" y2="91" />
              <line className="workout-arm-right" x1="113" y1="84" x2="168" y2="104" />
              <line x1="122" y1="126" x2="82" y2="180" />
              <line x1="123" y1="126" x2="132" y2="181" />
            </g>
          </>
        ) : (
          <g className="workout-body" stroke="currentColor" strokeWidth="12" strokeLinecap="round">
            <circle cx="110" cy="38" r="19" className="fill-emerald-400 stroke-none" />
            <line x1="110" y1="64" x2="110" y2="123" />
            <line className="workout-arm-left" x1="108" y1="78" x2="70" y2="112" />
            <line className="workout-arm-right" x1="112" y1="78" x2="150" y2="112" />
            <line className="workout-leg-left" x1="108" y1="122" x2="78" y2="178" />
            <line className="workout-leg-right" x1="112" y1="122" x2="142" y2="178" />
          </g>
        )}
        <path
          d={visual === "step" ? "M38 185h144" : "M62 192h96"}
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.2"
        />
      </svg>
      <span className="mb-4 rounded-full bg-card/85 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
        {running ? labels[visual] : "Нажмите «Начать»"}
      </span>
    </div>
  );
}
